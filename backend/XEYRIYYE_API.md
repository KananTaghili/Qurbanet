# Xeyriyyə (Charity Campaign) — API Sənədi

Bu sənəd xeyriyyə modulu üçün əlavə olunmuş bütün backend endpointlərini, onların
header / body / response strukturunu, validasiyaları və harada istifadə olunacağını izah edir.

---

## 0. Ümumi məlumat

**Base URL (lokal):** `http://localhost:4000`
**Base URL (prod):** `https://api.qurbanet.az`

Bütün public/user endpointlər `/api/campaigns` altındadır.
Admin endpointlər `/api/admin/...` altındadır.

### Cavab zərfi (bütün cavablar belədir)

Uğurlu:
```json
{ "success": true, "message": "Uğurlu", "data": { ... } }
```

Xəta:
```json
{ "success": false, "message": "Xəta mətni" }
```

### Authentication növləri

| Növ | Header | İzah |
|-----|--------|------|
| **Public** | yoxdur | Hamı çağıra bilər |
| **optionalAuth** | `Authorization: Bearer <USER_JWT>` (istəyə bağlı) | Token varsa istifadəçi tanınır (userId set olunur), yoxdursa qeydiyyatsız (guest) kimi davam edir |
| **authenticate** | `Authorization: Bearer <USER_JWT>` (məcburi) | Yalnız qeydiyyatlı istifadəçi |
| **adminAuth** | `Authorization: Bearer <ADMIN_JWT>` (məcburi) | Yalnız admin panel |

---

## 1. PUBLIC / USER ENDPOINTLƏR (`/api/campaigns`)

---

### 1.1 — Tənzimləmələr + heyvanlar siyahısı

```
GET /api/campaigns/settings
```

**Auth:** yoxdur (public)
**Harada istifadə:** Açılış modalı açılanda — heyvan seçim grid-i və limitlər üçün.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "settings": {
      "minOpenPercent": 30,        // açılış üçün minimum % (admin idarə edir)
      "minDonation": 10,           // minimum ianə məbləği AZN (admin idarə edir)
      "allowAnonymous": true,      // anonim icazəlidir?
      "allowGuest": true,          // qeydiyyatsız icazəlidir?
      "guestNameRequired": false,  // qeydiyyatsızda ad-soyad məcburi?
      "guestPhoneRequired": false, // qeydiyyatsızda telefon məcburi?
      "onePerAnimal": true,        // heyvan başına açılış limiti aktivdir?
      "maxPerAnimal": 1            // hər heyvandan maksimum neçə AKTİV açılış ola bilər
    },
    "animals": [
      {
        "_id": "6a2bfe82b6f72badbceedb58",  // Category _id — açılış yaradanda animalId kimi göndərilir
        "nameAz": "Quzu",
        "emoji": "🐑",
        "image": "http://localhost:4000/api/files/<fileId>",
        "weightRange": "40-45 kg",   // admin seçdiyi standart çəki
        "price": 400,                // həmin çəkinin qiyməti (kampaniyanın tam məbləği)
        "activeCount": 0             // bu heyvandan hazırda neçə aktiv açılış var
      }
    ]
  }
}
```

**Qeyd:** Heyvanlar QURBANLIQLA EYNİ mənbədən (`Category` kolleksiyası) gəlir.
Hər heyvanın `weightOptions` siyahısından admin tərəfindən seçilmiş standart çəki/qiymət
göstərilir (Category.`charityWeightKey`). Seçilməyibsə birinci aktiv çəki götürülür.
Yalnız `isActive: true` və qiyməti > 0 olan heyvanlar qayıdır.

**`activeCount` istifadəsi (frontend):** Əgər `onePerAnimal=true` və heyvanın
`activeCount >= maxPerAnimal`-dirsə, həmin heyvanı açılış modalında **seçilməz** (limit dolub)
göstərin. Beləliklə istifadəçi limit dolmuş heyvanı seçə bilməz.

---

### 1.2 — Aktiv (davam edən) kampaniyalar

```
GET /api/campaigns?page=1&limit=20
```

**Auth:** yoxdur (public)
**Harada istifadə:** Əsas səhifə — "Davam edən açılışlar" grid-i.

**Validasiya/məntiq:** Yalnız `status = "collecting"` VƏ `collectedAmount > 0` olanlar qayıdır
(yəni açan ən azı ilkin ödənişini edib). Ödənilməmiş "kabus" açılışlar görünmür.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "campaigns": [ /* PublicCampaign obyektləri (aşağıda) */ ],
    "pagination": { "total": 5, "page": 1, "totalPages": 1 }
  }
}
```

---

### 1.3 — Tamamlanmış kampaniyalar

```
GET /api/campaigns/completed?page=1&limit=20
```

**Auth:** yoxdur (public)
**Harada istifadə:** "Tamamlanmış" menyusu.
**Məntiq:** Yalnız `status = "completed"`. `completedAt` üzrə azalan sıra.

**Response:** 1.2 ilə eyni struktur (`campaigns` + `pagination`).
Tamamlanmışlarda `media` massivi də doludur (kəsim şəkil/video).

---

### 1.4 — Tək kampaniya (detal)

```
GET /api/campaigns/:id
```

**Auth:** `optionalAuth` (token istəyə bağlı)
**Harada istifadə:** Kampaniya detal səhifəsi (ianəçilər siyahısı, progress, media).

**Görünmə qaydası:**
- **Public görünür:** `status = "completed"`, və ya `status = "collecting"` VƏ `collectedAmount > 0`.
- **Ləğv edilmiş (`cancelled`) / ödənilməmiş (abandoned) kampaniya public görünmür** →
  yalnız iştirakçısı (açan və ya ianəçi, `Authorization: Bearer <USER_JWT>` ilə) görə bilər.
  Başqa hər kəsə **404** qaytarılır (mövcudluğu gizlənir).

**Response 200:** `data` = PublicCampaign obyekti (aşağıda).
**Xəta 404:** `{ "success": false, "message": "Kampaniya tapılmadı" }`

---

### 1.5 — Mənim kampaniyalarım (İanələrim)

```
GET /api/campaigns/my
```

**Auth:** `authenticate` — **məcburi** `Authorization: Bearer <USER_JWT>`
**Harada istifadə:** "İanələrim" səhifəsi.

**Məntiq:** Yalnız istifadəçinin **ən azı bir ödənilmiş (paid)** ianəsi olan kampaniyalar.
Hər kampaniyaya əlavə 2 sahə qoşulur:

**Response 200:**
```json
{
  "success": true,
  "data": {
    "campaigns": [
      {
        /* ...PublicCampaign sahələri... */
        "iAmOpener": true,       // bu istifadəçi kampaniyanı açıb?
        "myPaidAmount": 120      // istifadəçinin bu kampaniyaya ödədiyi cəmi AZN
      }
    ]
  }
}
```

> Frontend "Açdığım açılışlar" / "İştirak etdiyim açılışlar" tab-larını `iAmOpener` ilə ayırır.
> Statistikada "ümumi ödədiyim" üçün `myPaidAmount` cəmlənir.

---

### 1.6 — Yeni açılış yarat

```
POST /api/campaigns
```

**Auth:** `optionalAuth` — token varsa göndər (qeydiyyatlı), yoxsa guest.
**Content-Type:** `application/json`
**Harada istifadə:** Açılış modalında "Açılışı təsdiqlə" düyməsi (Epoint-dən ƏVVƏL).

**Body:**
```json
{
  "animalId": "6a2bfe82b6f72badbceedb58",  // MƏCBURİ — settings.animals[]._id
  "amount": 120,                            // MƏCBURİ — ilkin ödəniş məbləği AZN
  "isAnonymous": false,                     // anonim açılış?
  "openerName": "Kanan",                    // guest üçün ad (anonim deyilsə)
  "openerPhone": "+994...",                 // guest üçün telefon (anonim deyilsə)
  "note": "Qeyd mətni"                      // istəyə bağlı
}
```

**Validasiyalar:**
- `animalId` və `amount` məcburidir → yoxdursa **400** "Heyvan və məbləğ tələb olunur"
- Heyvan mövcud və aktiv olmalı → **404** "Heyvan tapılmadı"
- Heyvanın qiyməti təyin olunmalı → **400** "Heyvanın qiyməti təyin edilməyib"
- `amount` ≥ `qiymət × minOpenPercent / 100` → **400** "Minimum açılış məbləği X AZN-dir"
- `amount` ≤ heyvanın tam qiyməti → **400** "Ödəniş məbləği heyvanın qiymətindən çox ola bilməz"
- Qeydiyyatsızlara icazə yoxdursa və token yoxdursa → **403** "Kampaniya açmaq üçün qeydiyyat tələb olunur"
- **Hər heyvandan ümumilikdə maksimum `maxPerAnimal` AKTİV açılış ola bilər** (istifadəçidən ASILI DEYİL — qlobal limit) — yalnız `onePerAnimal=true` olduqda → **400** "Bu heyvan üçün artıq aktiv açılış var" (limit 1-dirsə) və ya "Bu heyvan üçün aktiv açılış limiti (N) dolub". Limit və yandır/söndür admin paneldən idarə olunur.
- Anonim yalnız `allowAnonymous=true` olduqda tətbiq olunur (həm guest, həm qeydiyyatlı). Anonim olduqda ad/telefon saxlanmır.
- Guest + admin ad/telefon məcburi edibsə və anonim deyilsə → **400** "Ad Soyad tələb olunur" / "Telefon nömrəsi tələb olunur"

**Response 201:**
```json
{
  "success": true,
  "message": "Kampaniya yaradıldı",
  "data": {
    "campaignId": "6a301f7b2ab2d492d490b0ce",
    "donationId": "6a301f7b2ab2d492d490b0cf",  // açanın ilk (pending) ödənişi
    "campaignNumber": "XYR-2026-00002"
  }
}
```

> ⚠️ Bu mərhələdə kampaniya yaradılır amma ödəniş HƏLƏ olmayıb (donation `pending`).
> Növbəti addımda `epoint/start` çağırılır. Ödəniş edilməsə kampaniya heç yerdə görünmür.

---

### 1.7 — Mövcud kampaniyaya ianə et

```
POST /api/campaigns/:id/donate
```

**Auth:** `optionalAuth`
**Content-Type:** `application/json`
**Harada istifadə:** Detal səhifəsində "İanə et" modalı (Epoint-dən ƏVVƏL).

**Body:**
```json
{
  "amount": 50,            // MƏCBURİ
  "isAnonymous": false,
  "donorName": "Ad",       // guest üçün (anonim deyilsə)
  "donorPhone": "+994...", // guest üçün (anonim deyilsə)
  "note": "Qeyd"           // istəyə bağlı
}
```

**Validasiyalar:**
- Kampaniya mövcud olmalı → **404** "Kampaniya tapılmadı"
- `status = "collecting"` olmalı → **400** "Bu kampaniya artıq aktiv deyil"
- Qalan məbləğ = tam − toplanmış. **Effektiv minimum = min(minDonation, qalan).**
  - `amount` < effektiv minimum → **400** "Minimum ianə məbləği X AZN-dir"
  - **Vacib:** Qalan məbləğ minimumdan azdırsa (məs. qalan 3, min 10), istifadəçi qalan 3 AZN-i tam ödəyə bilər (limit bypass).
- `amount` > qalan → **400** "Maksimum ianə məbləği X AZN-dir"
- Guest icazəsi/ad/telefon və anonim qaydaları açılışla eynidir.

**Response 201:**
```json
{ "success": true, "message": "İanə əlavə edildi", "data": { "donationId": "..." } }
```

---

### 1.8 — Epoint ödənişini başlat

```
POST /api/campaigns/:id/epoint/start
```

**Auth:** `optionalAuth`
**Content-Type:** `application/json`
**Harada istifadə:** 1.6 və ya 1.7-dən dərhal sonra — istifadəçini Epoint-ə yönləndirmək üçün.

**Body:**
```json
{ "donationId": "6a301f7b2ab2d492d490b0cf" }  // 1.6/1.7-dən gələn donationId
```

**Validasiyalar:**
- Kampaniya → **404** "Kampaniya tapılmadı"
- Donation → **404** "İanə tapılmadı"
- Artıq ödənilibsə → **400** "Bu ödəniş artıq tamamlanıb"

**Response 200:**
```json
{ "success": true, "data": { "redirect_url": "https://ecomm.pashabank.az/..." } }
```

**Frontend nə etməli:** `window.location.href = data.redirect_url` — istifadəçi Epoint
səhifəsinə gedir.

---

## 2. EPOINT CALLBACK AXINI (frontend bilməlidir)

Ödənişdən sonra Epoint istifadəçini backend callback-ına qaytarır, backend isə frontendə
yönləndirir. **Frontend bu URL-ləri qarşılamalıdır:**

**Uğurlu ödəniş →**
```
/charity-campaigns/confirmation?campaignId=<id>&role=opener   (açılış üçün)
/charity-campaigns/confirmation?campaignId=<id>&role=donor    (ianə üçün)
```
Bu səhifə `GET /api/campaigns/:id` ilə kampaniyanı çəkib təsdiq ekranı göstərir.

**Uğursuz ödəniş →**
```
/charity-campaigns?payment=fail&message=<xəta mətni>
```
Əsas səhifə `payment=fail` query-sini oxuyub xəta banneri göstərir.

> Qeyd: Frontend route prefiksi `/charity-campaigns`-dir. (`/charity` mövcud başqa funksiya
> tərəfindən tutulduğu üçün istifadə olunmur.)

**Backend tərəfdə nə baş verir (avtomatik):**
- Ödəniş `get-status` ilə təsdiqlənir → donation `paid`, `collectedAmount` yenilənir.
- Açanın ödənişi uğurlu olduqda kampaniya görünməyə başlayır.
- Tam məbləğ yığıldıqda (`qalan ≤ 0`) kampaniya avtomatik `completed` olur.
  (Qalan az olanda avtomatik tamamlanmır — bypass var, bax 1.7.)

---

## 3. PublicCampaign obyekti (1.2–1.5-də qayıdan struktur)

```json
{
  "_id": "6a301f7b2ab2d492d490b0ce",
  "campaignNumber": "XYR-2026-00002",
  "animal": {
    "id": "6a2bfe82b6f72badbceedb58",  // Category _id
    "nameAz": "Quzu",
    "emoji": "🐑",
    "image": "http://localhost:4000/api/files/<fileId>",
    "weightRange": "40-45 kg",
    "price": 400
  },
  "totalAmount": 400,
  "collectedAmount": 120,
  "remainingAmount": 280,
  "percent": 30,                 // 0–100 arası tam ədəd
  "participantCount": 1,         // ödənilmiş ianələrin sayı
  "status": "collecting",        // collecting | completed | cancelled
  "completedAt": null,
  "createdAt": "2026-06-15T...",
  "opener": {
    "name": "Kanan",             // anonimdirsə null
    "isAnonymous": false
  },
  "donations": [                 // YALNIZ ödənilmiş ianələr
    {
      "_id": "...",
      "name": "Kanan",           // anonimdirsə null
      "isAnonymous": false,
      "isOpener": true,          // açanın ödənişidirmi?
      "amount": 120,
      "percent": 30,             // bu ianənin ümumi məbləğdə payı (faiz, 2 onluq)
      "note": "...",             // anonimdirsə null
      "paidAt": "2026-06-15T..."
    }
  ],
  "media": []                    // yalnız completed olanda dolur: [{type:"photo"|"video", url, ...}]
}
```

---

## 4. ADMIN ENDPOINTLƏR (`/api/admin/...`)

**Bütün admin endpointlər üçün:** `Authorization: Bearer <ADMIN_JWT>` (məcburi).

---

### 4.1 — Bütün kampaniyalar (admin siyahı)

```
GET /api/admin/charity-campaigns?page=1&limit=20&status=collecting
```
`status` istəyə bağlı filtr (`collecting` | `completed` | `cancelled`).

**Response:** `{ campaigns: [PublicCampaign...], pagination: {...} }`
**Harada istifadə:** Admin paneldə kampaniyalar siyahısı.

---

### 4.2 — Tək kampaniya (admin, tam məlumat)

```
GET /api/admin/charity-campaigns/:id
```
**Response:** `data` = TAM CharityCampaign sənədi (ödənilməmiş ianələr, telefon nömrələri,
adminNote daxil — public versiyadan fərqli olaraq hər şey görünür).
**Harada istifadə:** Admin kampaniya detal səhifəsi.

---

### 4.3 — Status / admin qeyd yenilə

```
PUT /api/admin/charity-campaigns/:id/status
```
**Body:**
```json
{ "status": "completed", "adminNote": "İstəyə bağlı qeyd" }
```
**Validasiya:** `status` yalnız `collecting|completed|cancelled` → əks halda **400**.
`completed` edildikdə `completedAt` avtomatik təyin olunur.
**Harada istifadə:** Admin kampaniyanı tamamlandı/ləğv etdi kimi işarələyəndə.

---

### 4.4 — Kəsim media yüklə (şəkil/video)

```
POST /api/admin/charity-campaigns/:id/media
```
**Content-Type:** `multipart/form-data`
**Sahə adı:** `files` (maksimum 10 fayl) — `upload.array("files", 10)`
**Məntiq:** Video uzantıları (.mp4/.mov/.avi/.mkv/.webm) "video", qalanları "photo" sayılır.
Fayllar GridFS-ə yüklənir, `url` = `/api/files/<fileId>`.
**Response:** `{ media: [...] }`
**Harada istifadə:** Tamamlanmış kampaniyaya kəsim şəkil/videolarını əlavə etmək.

---

### 4.5 — Media sil

```
DELETE /api/admin/charity-campaigns/:id/media/:mediaIndex
```
`mediaIndex` = media massivindəki indeks (0-dan başlayır).
**Harada istifadə:** Səhv yüklənmiş medianı silmək.

---

### 4.6 — Tənzimləmələr (oxu/yaz)

```
GET /api/admin/settings
PUT /api/admin/settings
```

`GET` cavabında və `PUT` body-də xeyriyyə ilə bağlı sahələr:
```json
{
  "campaignMinOpenPercent": 30,        // 1–100 arası
  "campaignMinDonation": 10,           // ≥ 1
  "campaignAllowAnonymous": true,
  "campaignAllowGuest": true,
  "campaignGuestNameRequired": false,
  "campaignGuestPhoneRequired": false,
  "campaignOnePerAnimal": true,       // heyvan başına açılış limiti aktiv?
  "campaignMaxPerAnimal": 1           // hər heyvandan maksimum aktiv açılış sayı
}
```
**Validasiya:** `campaignMinOpenPercent` 1–100 olmalı; `campaignMinDonation` ≥ 1; `campaignMaxPerAnimal` ≥ 1.
**Harada istifadə:** Admin paneldə "Kampaniya" tənzimləmələri bölməsi.

---

### 4.7 — Heyvanın xeyriyyə standart çəkisi (Category)

Ayrıca endpoint YOXDUR — mövcud kateqoriya (heyvan) endpointlərindən istifadə olunur:
```
PUT /api/admin/categories/:id   (mövcud heyvan redaktə endpointi)
```
Body-yə yeni sahə əlavə olundu:
```json
{ "charityWeightKey": "40_45" }   // həmin heyvanın weightOptions[].key dəyəri
```
**Məntiq:** Xeyriyyə açılışında bu heyvan üçün hansı çəki/qiymətin göstərələcəyini təyin edir.
Boş ("") buraxılsa birinci aktiv çəki seçimi götürülür.
**Harada istifadə:** Admin "Heyvanlar" → heyvan redaktə → "Çəki seçimləri" altında
"Xeyriyyə açılışında göstəriləcək çəki/qiymət" dropdown-u.

---

## 5. Məlumat modeli (CharityCampaign)

```
campaignNumber : "XYR-<il>-<5 rəqəm>"  (avtomatik)
animal         : { id(Category), nameAz, emoji, image, weightRange, price }
totalAmount    : heyvanın tam qiyməti
collectedAmount: ödənilmiş ianələrin cəmi
status         : "collecting" | "completed" | "cancelled"
opener         : { userId?, name, phone, isAnonymous, note }
donations[]    : {
                   userId?, name, phone, isAnonymous, isOpener,
                   amount, note,
                   paymentStatus: "pending"|"paid"|"failed",
                   transactionId, epointOrderId, paidAt
                 }
media[]        : { type:"photo"|"video", url, filename, fileId, uploadedAt }
adminNote      : admin qeydi
completedAt    : tamamlanma tarixi
```

---

## 6. Frontend axını — qısa xülasə (harada nə işlədilir)

| Səhifə | İşlədilən endpointlər |
|--------|----------------------|
| Əsas səhifə (`/charity-campaigns`) | `GET /campaigns`, `GET /campaigns/settings`, (auth varsa) `GET /campaigns/my` |
| Açılış modalı | `POST /campaigns` → `POST /campaigns/:id/epoint/start` |
| Detal (`/charity-campaigns/:id`) | `GET /campaigns/:id`, `GET /campaigns/settings` |
| İanə modalı | `POST /campaigns/:id/donate` → `POST /campaigns/:id/epoint/start` |
| İanələrim (`/charity-campaigns/ianelerim`) | `GET /campaigns/my` (auth) |
| Tamamlanmış (`/charity-campaigns/tamamlanmis`) | `GET /campaigns/completed` |
| Təsdiq (`/charity-campaigns/confirmation`) | `GET /campaigns/:id` |

### Açılış / ianə üçün düzgün axın (2 addım):
1. `POST /campaigns` (və ya `/donate`) → cavabdan `donationId` götür.
2. `POST /campaigns/:id/epoint/start` `{ donationId }` → cavabdan `redirect_url` götür →
   `window.location.href = redirect_url`.
3. Epoint sonrası istifadəçi avtomatik `/charity-campaigns/confirmation` (uğur) və ya
   `/charity-campaigns?payment=fail&message=...` (uğursuz) ünvanına qayıdır.

---

## 7. Admin panel — qısa xülasə (harada nə işlədilir)

| Bölmə | Endpointlər |
|-------|-------------|
| Kampaniyalar siyahısı | `GET /admin/charity-campaigns` |
| Kampaniya detalı | `GET /admin/charity-campaigns/:id` |
| Status/qeyd dəyişmə | `PUT /admin/charity-campaigns/:id/status` |
| Kəsim media | `POST /admin/charity-campaigns/:id/media`, `DELETE .../media/:index` |
| Kampaniya tənzimləmələri | `GET/PUT /admin/settings` (campaign* sahələri) |
| Heyvanın xeyriyyə çəkisi | `PUT /admin/categories/:id` (`charityWeightKey`) |
