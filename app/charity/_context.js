"use client";
import { createContext, useContext } from "react";

export const CharityLayoutContext = createContext({ openNewCampaign: () => {} });
export function useCharityLayout() { return useContext(CharityLayoutContext); }
