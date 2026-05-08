import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "../theme/colors";
import useCategoryActiveGuard from "../hooks/useCategoryActiveGuard";

const DEFAULT_REGION = {
  latitude: 40.4093,
  longitude: 49.8671,
  latitudeDelta: 0.08,
  longitudeDelta: 0.05,
};

const buildAddress = (geo = {}) => {
  const parts = [
    geo.street,
    geo.name,
    geo.district,
    geo.subregion,
    geo.city,
    geo.region,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : "Adres tapılmadı";
};

export default function DeliveryLocationPickerScreen({ navigation, route }) {
  useCategoryActiveGuard({
    animalType: route.params?.animalType,
    navigation,
    enabled: !!route.params?.animalType,
  });

  const insets = useSafeAreaInsets();
  const mapRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [region, setRegion] = useState(DEFAULT_REGION);
  const [marker, setMarker] = useState(null);
  const [address, setAddress] = useState("");

  const initialLocation = useMemo(() => route.params?.initialLocation, [route]);

  const resolveAddress = async (coords) => {
    try {
      const geocodes = await Location.reverseGeocodeAsync({
        latitude: coords.latitude,
        longitude: coords.longitude,
      });
      setAddress(buildAddress(geocodes[0]));
    } catch (_) {
      setAddress("Adres tapılmadı");
    }
  };

  const loadInitial = async () => {
    setLoading(true);
    try {
      if (initialLocation?.coordinates) {
        const lat = Number(initialLocation.coordinates.lat);
        const lng = Number(initialLocation.coordinates.lng);
        const start = {
          latitude: lat,
          longitude: lng,
        };
        setMarker(start);
        setRegion({ ...DEFAULT_REGION, ...start });
        setAddress(initialLocation.address || "");
        return;
      }

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "İcazə lazımdır",
          "Konum seçmək üçün location icazəsi verin.",
        );
        return;
      }

      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const start = {
        latitude: current.coords.latitude,
        longitude: current.coords.longitude,
      };

      setMarker(start);
      setRegion({ ...DEFAULT_REGION, ...start });
      await resolveAddress(start);
    } catch (err) {
      Alert.alert("Xəta", "Konum əldə edilə bilmədi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitial();
  }, []);

  const handleMapSelect = async (coords) => {
    setMarker(coords);
    setRegion((prev) => ({
      ...prev,
      latitude: coords.latitude,
      longitude: coords.longitude,
    }));
    await resolveAddress(coords);
  };

  const handleUseCurrent = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("İcazə lazımdır", "Hazırkı konum üçün icazə verin.");
        return;
      }

      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const coords = {
        latitude: current.coords.latitude,
        longitude: current.coords.longitude,
      };
      const nextRegion = { ...DEFAULT_REGION, ...coords };
      setRegion(nextRegion);
      mapRef.current?.animateToRegion(nextRegion, 500);
      await handleMapSelect(coords);
    } catch (_) {
      Alert.alert("Xəta", "Hazırkı konum alınmadı.");
    }
  };

  const handleSave = async () => {
    if (!marker) {
      Alert.alert("Konum seçin", "Xəritədə marker seçməlisiniz.");
      return;
    }

    setSaving(true);
    const payload = {
      address: address || "Adres tapılmadı",
      coordinates: {
        lat: marker.latitude,
        lng: marker.longitude,
      },
    };

    navigation.navigate({
      name: "Distribution",
      params: { pickedLocation: payload },
      merge: true,
    });
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={region}
        showsUserLocation
        showsMyLocationButton
        onPress={(e) => handleMapSelect(e.nativeEvent.coordinate)}
      >
        {marker && (
          <Marker
            coordinate={marker}
            title="Çatdırılma nöqtəsi"
            description={address || "Konum"}
            draggable
            onDragEnd={(e) => handleMapSelect(e.nativeEvent.coordinate)}
          />
        )}
      </MapView>

      <View style={[styles.bottomSheet, { paddingBottom: insets.bottom + 16 }]}>
        <Text style={styles.sheetTitle}>Çatdırılma konumu</Text>
        <Text style={styles.sheetAddress}>{address || "Konum seçilməyib"}</Text>
        {marker ? (
          <Text style={styles.sheetCoords}>
            {marker.latitude.toFixed(5)}, {marker.longitude.toFixed(5)}
          </Text>
        ) : null}

        <View style={styles.row}>
          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={handleUseCurrent}
            activeOpacity={0.85}
          >
            <Text style={styles.secondaryBtnText}>Hazırkı konum</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.primaryBtn, saving && styles.disabledBtn]}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryBtnText}>Təsdiqlə</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  map: { flex: 1 },
  bottomSheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    borderTopWidth: 1,
    borderColor: Colors.border,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  sheetAddress: {
    marginTop: 8,
    fontSize: 13,
    color: Colors.textPrimary,
    lineHeight: 18,
  },
  sheetCoords: {
    marginTop: 6,
    fontSize: 12,
    color: Colors.textSecondary,
  },
  row: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },
  secondaryBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    backgroundColor: Colors.white,
  },
  secondaryBtnText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: "700",
  },
  primaryBtn: {
    flex: 1,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    backgroundColor: Colors.primary,
  },
  primaryBtnText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: "700",
  },
  disabledBtn: {
    opacity: 0.6,
  },
});
