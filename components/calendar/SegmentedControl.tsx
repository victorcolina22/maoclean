import React from "react";
import { View, Text, Pressable } from "react-native";

interface SegmentOption<T extends string> {
  label: string;
  value: T;
}

interface SegmentedControlProps<T extends string> {
  value: T;
  options: SegmentOption<T>[];
  onChange: (v: T) => void;
}

export function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
}: SegmentedControlProps<T>) {
  return (
    <View className="mx-4 my-3 bg-neutral-100 p-1 rounded-xl flex-row">
      {options.map((opt) => {
        const isActive = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            className={`flex-1 py-1.5 rounded-lg items-center ${
              isActive ? "bg-white" : ""
            }`}
          >
            <Text
              className={
                isActive
                  ? "text-neutral-900 font-semibold text-sm"
                  : "text-neutral-500 text-sm"
              }
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
