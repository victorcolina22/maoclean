import React, { useRef, useState } from "react";
import { FlatList, Modal, Pressable, Text, View } from "react-native";

interface Props {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

interface DurationSlot {
  minutes: number;
  label: string;
}

const SLOT_HEIGHT = 50;

const DURATION_SLOTS: DurationSlot[] = Array.from(
  { length: (480 - 15) / 15 + 1 },
  (_, i) => {
    const minutes = 15 + i * 15;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    let label: string;
    if (h === 0) {
      label = `${m} min`;
    } else if (m === 0) {
      label = `${h} h`;
    } else {
      label = `${h} h ${m} min`;
    }
    return { minutes, label };
  },
);

function slotIndexForMinutes(minutes: number): number {
  const val = Math.max(15, Math.min(480, Math.round(minutes / 15) * 15));
  const idx = DURATION_SLOTS.findIndex((s) => s.minutes === val);
  return idx >= 0 ? idx : 0;
}

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} h`;
  return `${h} h ${m} min`;
}

export function DurationPickerField({ label, value, onChange, error }: Props) {
  const [open, setOpen] = useState(false);
  const flatListRef = useRef<FlatList<DurationSlot>>(null);

  const parsed = parseInt(value, 10);
  const currentMinutes = Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  const display = currentMinutes > 0 ? formatDuration(currentMinutes) : null;

  const selectedIndex = currentMinutes > 0 ? slotIndexForMinutes(currentMinutes) : 0;

  const scrollToSelected = () => {
    flatListRef.current?.scrollToIndex({
      index: selectedIndex,
      animated: false,
      viewPosition: 0.5,
    });
  };

  const onSlotSelect = (slot: DurationSlot) => {
    onChange(String(slot.minutes));
    setOpen(false);
  };

  return (
    <View className="mb-4">
      {label && (
        <Text className="text-sm font-medium text-neutral-700 mb-1">
          {label}
        </Text>
      )}

      <Pressable
        onPress={() => setOpen(true)}
        className={`bg-white border rounded-xl px-4 py-3 ${error ? "border-red-500" : "border-neutral-200"}`}
      >
        <Text
          className={
            display
              ? "text-base text-neutral-900"
              : "text-base text-neutral-400"
          }
        >
          {display ?? "Selecciona la duración"}
        </Text>
      </Pressable>

      {error && <Text className="text-xs text-red-500 mt-1">{error}</Text>}

      {open && (
        <Modal transparent animationType="slide" onShow={scrollToSelected}>
          <View
            style={{
              flex: 1,
              justifyContent: "flex-end",
              backgroundColor: "rgba(0,0,0,0.4)",
            }}
          >
            <View
              style={{
                backgroundColor: "white",
                borderTopLeftRadius: 16,
                borderTopRightRadius: 16,
                paddingBottom: 32,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  paddingHorizontal: 20,
                  paddingVertical: 16,
                  borderBottomWidth: 1,
                  borderBottomColor: "#F3F4F6",
                }}
              >
                <Pressable onPress={() => setOpen(false)} hitSlop={12}>
                  <Text style={{ color: "#6B7280", fontSize: 16 }}>
                    Cancelar
                  </Text>
                </Pressable>
                <Text
                  style={{ fontWeight: "600", color: "#111827", fontSize: 16 }}
                >
                  Duración
                </Text>
                <View style={{ width: 70 }} />
              </View>

              <FlatList
                ref={flatListRef}
                data={DURATION_SLOTS}
                keyExtractor={(item) => String(item.minutes)}
                style={{ maxHeight: 300 }}
                getItemLayout={(_, index) => ({
                  length: SLOT_HEIGHT,
                  offset: SLOT_HEIGHT * index,
                  index,
                })}
                onScrollToIndexFailed={() => {}}
                renderItem={({ item, index }) => {
                  const selected = index === selectedIndex;
                  return (
                    <Pressable
                      onPress={() => onSlotSelect(item)}
                      style={{
                        height: SLOT_HEIGHT,
                        paddingHorizontal: 24,
                        backgroundColor: selected ? "#EFF6FF" : "white",
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 17,
                          color: selected ? "#2563EB" : "#111827",
                          fontWeight: selected ? "600" : "400",
                        }}
                      >
                        {item.label}
                      </Text>
                      {selected && (
                        <Text style={{ color: "#2563EB", fontSize: 16 }}>
                          ✓
                        </Text>
                      )}
                    </Pressable>
                  );
                }}
              />
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}
