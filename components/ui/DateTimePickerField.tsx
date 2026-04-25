import React, { useRef, useState } from "react";
import { Modal, Platform, Pressable, Text, View } from "react-native";
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

export function DateTimePickerField({ label, value, onChange, error }: Props) {
  const [step, setStep] = useState<Step>("idle");
  const [tempDate, setTempDate] = useState(new Date());
  // ref to carry date across the two Android steps without race conditions
  const pendingDate = useRef(new Date());

  const parsed = parseScheduledAt(value);
  const current = parsed.isValid() ? parsed.toDate() : new Date();
  const display = parsed.isValid() ? parsed.format("DD/MM/YYYY HH:mm") : null;

  const open = () => {
    pendingDate.current = current;
    setTempDate(current);
    setStep("date");
  };

  // ── Android ──────────────────────────────────────────────────────────────
  const onAndroidDateChange = (_: DateTimePickerEvent, selected?: Date) => {
    setStep("idle");
    if (!selected) return;
    pendingDate.current = selected;
    // give the date dialog time to fully dismiss before showing the time dialog
    setTimeout(() => setStep("time"), 50);
  };

  const onAndroidTimeChange = (_: DateTimePickerEvent, selected?: Date) => {
    setStep("idle");
    if (!selected) return;
    const merged = dayjs(pendingDate.current)
      .hour(dayjs(selected).hour())
      .minute(dayjs(selected).minute())
      .second(0);
    onChange(merged.format(SCHEDULED_AT_FORMAT));
  };

  // ── iOS ──────────────────────────────────────────────────────────────────
  const onIOSChange = (_: DateTimePickerEvent, selected?: Date) => {
    if (selected) setTempDate(selected);
  };

  const confirmIOS = () => {
    if (step === "date") {
      setStep("time");
    } else {
      setStep("idle");
      onChange(dayjs(tempDate).second(0).format(SCHEDULED_AT_FORMAT));
    }
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

      {/* Android: native modal dialogs, rendered directly */}
      {!isIOS && step === "date" && (
        <RNDateTimePicker
          value={pendingDate.current}
          mode="date"
          display="default"
          onChange={onAndroidDateChange}
        />
      )}
      {!isIOS && step === "time" && (
        <RNDateTimePicker
          value={pendingDate.current}
          mode="time"
          is24Hour
          display="default"
          onChange={onAndroidTimeChange}
        />
      )}

      {/* iOS: inline picker inside a bottom-sheet modal with Cancel / Listo */}
      {isIOS && step !== "idle" && (
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
                <Pressable onPress={() => setStep("idle")} hitSlop={12}>
                  <Text style={{ color: "#6B7280", fontSize: 16 }}>
                    Cancelar
                  </Text>
                </Pressable>
                <Text
                  style={{ fontWeight: "600", color: "#111827", fontSize: 16 }}
                >
                  {step === "date" ? "Fecha" : "Hora"}
                </Text>
                <Pressable onPress={confirmIOS} hitSlop={12}>
                  <Text
                    style={{
                      color: "#2563EB",
                      fontWeight: "600",
                      fontSize: 16,
                    }}
                  >
                    Listo
                  </Text>
                </Pressable>
              </View>
              <RNDateTimePicker
                value={tempDate}
                mode={step === "date" ? "date" : "time"}
                display="inline"
                is24Hour
                onChange={onIOSChange}
                style={{ backgroundColor: "black" }}
              />
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}
