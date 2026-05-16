import React, { useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";

const API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

interface Suggestion {
  placeId: string;
  mainText: string;
  secondaryText: string;
}

export interface AddressResult {
  address: string;
  commune: string;
  lat: number;
  lng: number;
}

interface Props {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  onSelect: (result: AddressResult) => void;
  error?: string;
}

export function AddressAutocomplete({
  label,
  placeholder = "Busca una dirección...",
  value,
  onChangeText,
  onSelect,
  error,
}: Props) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchSuggestions = useCallback(async (text: string) => {
    if (text.length < 3) {
      setSuggestions([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(text)}&key=${API_KEY}&language=es&components=country:cl&types=address`
      );
      const json = await res.json();
      if (json.status === "OK") {
        setSuggestions(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          json.predictions.map((p: any) => ({
            placeId: p.place_id,
            mainText: p.structured_formatting.main_text,
            secondaryText: p.structured_formatting.secondary_text,
          }))
        );
      } else {
        setSuggestions([]);
      }
    } catch {
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChangeText = (text: string) => {
    onChangeText(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(text), 350);
  };

  const handleSelect = async (s: Suggestion) => {
    onChangeText(s.mainText);
    setSuggestions([]);
    try {
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${s.placeId}&key=${API_KEY}&fields=geometry,address_components`
      );
      const json = await res.json();
      if (json.status === "OK") {
        const { lat, lng } = json.result.geometry.location;
        const components: Array<{ long_name: string; types: string[] }> =
          json.result.address_components;
        const commune =
          components.find((c) => c.types.includes("locality"))?.long_name ||
          components.find((c) =>
            c.types.includes("administrative_area_level_3")
          )?.long_name ||
          components.find((c) => c.types.includes("sublocality"))?.long_name ||
          "";
        onSelect({ address: s.mainText, commune, lat, lng });
      } else {
        onSelect({ address: s.mainText, commune: "", lat: 0, lng: 0 });
      }
    } catch {
      onSelect({ address: s.mainText, commune: "", lat: 0, lng: 0 });
    }
  };

  return (
    <View className="mb-4">
      {label && (
        <Text className="text-sm font-medium text-neutral-700 mb-1">
          {label}
        </Text>
      )}
      <View
        className={`flex-row items-center bg-white border rounded-xl px-4 ${
          error ? "border-red-500" : "border-neutral-200"
        }`}
      >
        <TextInput
          className="flex-1 py-3 text-base text-neutral-900"
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          value={value}
          onChangeText={handleChangeText}
        />
        {loading && <ActivityIndicator size="small" color="#9CA3AF" />}
      </View>
      {error && (
        <Text className="text-xs text-red-500 mt-1">{error}</Text>
      )}
      {suggestions.length > 0 && (
        <View className="bg-white border border-neutral-200 rounded-xl mt-1 overflow-hidden">
          {suggestions.map((s, idx) => (
            <TouchableOpacity
              key={s.placeId}
              onPress={() => handleSelect(s)}
              className={`px-4 py-3 ${
                idx < suggestions.length - 1 ? "border-b border-neutral-100" : ""
              }`}
            >
              <Text
                className="text-sm font-medium text-neutral-900"
                numberOfLines={1}
              >
                {s.mainText}
              </Text>
              <Text
                className="text-xs text-neutral-500 mt-0.5"
                numberOfLines={1}
              >
                {s.secondaryText}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}
