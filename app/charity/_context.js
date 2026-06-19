"use client";
import { createContext, useContext } from "react";

export const CharityLayoutContext = createContext({ openNewCampaign: (_animalName) => {} });
export function useCharityLayout() { return useContext(CharityLayoutContext); }
