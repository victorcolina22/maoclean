import React, { useRef, useState } from "react";
import { FlatList, Modal, Platform, Pressable, Text, View } from "react-native";
import RNDateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import dayjs from "dayjs";
import { SCHEDULED_AT_FORMAT, parseScheduledAt } from "@/utils/dateUtils";

type Step = "idle" | "date" | "time";

interface Props {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

interface TimeSlot {
  hour: number;
  minute: number;
  label: string;
}

const SLOT_HEIGHT = 50;

const TIME_SLOTS: TimeSlot[] = Array.from({ length: (22 - 7) * 4 + 1 }, (_, i) => {
  const total = 7 * 60 + i * 15;
  const hour = Math.floor(total / 60);
  const minute = total % 60;
  return {
    hour,
    minute,
    label: `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`,
  };
});

function nearestSlotIndex(date: Date): number {
  const total = date.getHours() * 60 + date.getMinutes();
  let best = 0;
  let bestDiff = Infinity;
  TIME_SLOTS.forEach((slot, i) => {
    const diff = Math.abs(slot.hour * 60 + slot.minute - total);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = i;
    }
  });
  return best;
}

export function DateTimePickerField({ label, value, onChange, error }: Props) {
  const [step, setStep] = useState<Step>("idle");
  const [tempDate, setTempDate] = useState(new Date());
  const pendingDate = useRef(new Date());
  const flatListRef = useRef<FlatList<TimeSlot>>(null);

  const parsed = parseScheduledAt(value);
  const current = parsed.isValid() ? parsed.toDate() : new Date();
  const display = parsed.isValid() ? parsed.format("DD/MM/YYYY HH:mm") : null;
  const selectedSlotIndex = step === "time" ? nearestSlotIndex(pendingDate.current) : -1;

  const open = () => {
    pendingDate.current = current;
    setTempDate(current);
    setStep("date");
  };

  // ── Android date ──────────────────────────────────────────────────────────
  const onAndroidDateChange = (_: DateTimePickerEvent, selected?: Date) => {
    setStep("idle");
    if (!selected) return;
    pendingDate.current = selected;
    setTimeout(() => setStep("time"), 50);
  };

  // ── iOS date ──────────────────────────────────────────────────────────────
  const onIOSDateChange = (_: DateTimePickerEvent, selected?: Date) => {
    if (selected) setTempDate(selected);
  };

  const confirmIOSDate = () => {
    pendingDate.current = tempDate;
    setStep("time");
  };

  // ── Time slot (cross-platform) ────────────────────────────────────────────
  const onSlotSelect = (slot: TimeSlot) => {
    const merged = dayjs(pendingDate.current)
      .hour(slot.hour)
      .minute(slot.minute)
      .second(0);
    onChange(merged.format(SCHEDULED_AT_FORMAT));
    setStep("idle");
  };

  const scrollToCurrentSlot = () => {
    const idx = nearestSlotIndex(pendingDate.current);
    flatListRef.current?.scrollToIndex({
      index: idx,
      animated: false,
      viewPosition: 0.5,
    });
  };

  const isIOS = Platform.OS === "ios";

  return (
    <View className="mb-4">
      {label && (
        <Text className="text-sm font-medium text-neutral-700 mb-1">
          {label}
        </Text>
      )}

      <Pressable
        onPress={open}
        className={`bg-white border rounded-xl px-4 py-3 ${error ? "border-red-500" : "border-neutral-200"}`}
      >
        <Text
          className={
            display
              ? "text-base text-neutral-900"
              : "text-base text-neutral-400"
          }
        >
          {display ?? "Selecciona fecha y hora"}
        </Text>
      </Pressable>

      {error && <Text className="text-xs text-red-500 mt-1">{error}</Text>}

      {/* Android: native date dialog */}
      {!isIOS && step === "date" && (
        <RNDateTimePicker
          value={pendingDate.current}
          mode="date"
          display="default"
          onChange={onAndroidDateChange}
        />
      )}

      {/* iOS: inline date picker in bottom sheet */}
      {isIOS && step === "date" && (
        <Modal transparent animationType="slide">
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
              <PickerHeader
                title="Fecha"
                onCancel={() => setStep("idle")}
                onConfirm={confirmIOSDate}
              />
              <RNDateTimePicker
                value={tempDate}
                mode="date"
                display="inline"
                onChange={onIOSDateChange}
                style={{ backgroundColor: "black" }}
              />
            </View>
          </View>
        </Modal>
      )}

      {/* Time slot picker: same UI on iOS and Android */}
      {step === "time" && (
        <Modal transparent animationType="slide" onShow={scrollToCurrentSlot}>
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
              <PickerHeader
                title="Hora"
                onCancel={() => setStep("idle")}
              />
              <FlatList
                ref={flatListRef}
                data={TIME_SLOTS}
                keyExtractor={(item) => item.label}
                style={{ maxHeight: 300 }}
                getItemLayout={(_, index) => ({
                  length: SLOT_HEIGHT,
                  offset: SLOT_HEIGHT * index,
                  index,
                })}
                onScrollToIndexFailed={() => {}}
                renderItem={({ item, index }) => {
                  const selected = index === selectedSlotIndex;
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

function PickerHeader({
  title,
  onCancel,
  onConfirm,
}: {
  title: string;
  onCancel: () => void;
  onConfirm?: () => void;
}) {
  return (
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
      <Pressable onPress={onCancel} hitSlop={12}>
        <Text style={{ color: "#6B7280", fontSize: 16 }}>Cancelar</Text>
      </Pressable>
      <Text style={{ fontWeight: "600", color: "#111827", fontSize: 16 }}>
        {title}
      </Text>
      {onConfirm ? (
        <Pressable onPress={onConfirm} hitSlop={12}>
          <Text style={{ color: "#2563EB", fontWeight: "600", fontSize: 16 }}>
            Listo
          </Text>
        </Pressable>
      ) : (
        <View style={{ width: 50 }} />
      )}
    </View>
  );
}
