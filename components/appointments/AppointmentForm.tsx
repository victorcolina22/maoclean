import React, { useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  LayoutChangeEvent,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  useForm,
  Controller,
  useFieldArray,
  useWatch,
  Control,
  FieldErrors,
  FormProvider,
} from "react-hook-form";
import { Timestamp, GeoPoint } from "firebase/firestore";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { DateTimePickerField } from "@/components/ui/DateTimePickerField";
import { AddressAutocomplete } from "@/components/ui/AddressAutocomplete";
import {
  CreateAppointmentDTO,
  ServiceItem,
  ServiceType,
  AppointmentStatus,
  PaymentStatus,
} from "@/domain/entities/appointment";
import { SERVICE_LABELS } from "@/constants/services";
import { SANTIAGO_COMMUNES } from "@/constants/communes";
import { parseScheduledAt } from "@/utils/dateUtils";
import { formatCLP } from "@/utils/formatUtils";
import ItemRow from "./ItemRow";

interface ItemFormValue {
  type: ServiceType;
  label: string;
  qty: string;
  unitPrice: string;
}

interface FormValues {
  clientName: string;
  clientPhone: string;
  items: ItemFormValue[];
  address: string;
  commune: string;
  scheduledAt: string;
  deliveryDate: string;
  estimatedDuration: string;
  paymentStatus: PaymentStatus;
  status: AppointmentStatus;
  notes: string;
}

interface AppointmentFormProps {
  defaultValues?: Partial<FormValues>;
  onSubmit: (data: Omit<CreateAppointmentDTO, "userId">) => Promise<void>;
  isLoading?: boolean;
  submitLabel?: string;
  onFinalize?: () => void;
  isFinalizing?: boolean;
}

export function AppointmentForm({
  defaultValues,
  onSubmit,
  isLoading,
  submitLabel = "Guardar",
  onFinalize,
  isFinalizing,
}: AppointmentFormProps) {
  const methods = useForm<FormValues>({
    defaultValues: {
      items: [{ type: "casa", label: "Casa", qty: "1", unitPrice: "" }],
      paymentStatus: "pending",
      status: "scheduled",
      estimatedDuration: "60",
      commune: "Santiago",
      deliveryDate: "",
      ...defaultValues,
    },
  });

  const {
    control,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors },
  } = methods;

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
    rules: { minLength: { value: 1, message: "Agrega al menos un servicio" } },
  });

  const watchedItems = useWatch({ control, name: "items" });
  const computedTotal = (watchedItems ?? []).reduce(
    (sum, it) =>
      sum + (parseInt(it?.qty, 10) || 0) * (parseInt(it?.unitPrice, 10) || 0),
    0,
  );

  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);
  const yOffsets = useRef<Record<string, number>>({});
  const coordinatesRef = useRef({ lat: 0, lng: 0 });

  const storeY = (name: string) => (e: LayoutChangeEvent) => {
    yOffsets.current[name] = e.nativeEvent.layout.y;
  };

  const scrollTo = (name: string) => {
    const y = yOffsets.current[name];
    if (y != null)
      scrollViewRef.current?.scrollTo({
        y: Math.max(0, y - 16),
        animated: true,
      });
  };

  const handleFormSubmit = async (values: FormValues) => {
    const items: ServiceItem[] = values.items.map((it) => ({
      type: it.type,
      label: it.type === "otro" ? it.label.trim() : SERVICE_LABELS[it.type],
      qty: parseInt(it.qty, 10),
      unitPrice: parseInt(it.unitPrice, 10),
    }));

    const dto: Omit<CreateAppointmentDTO, "userId"> = {
      clientName: values.clientName,
      clientPhone: values.clientPhone || undefined,
      items,
      location: {
        address: values.address,
        coordinates: new GeoPoint(
          coordinatesRef.current.lat,
          coordinatesRef.current.lng,
        ),
        commune: values.commune,
      },
      scheduledAt: Timestamp.fromDate(
        parseScheduledAt(values.scheduledAt).toDate(),
      ),
      amountPaid: 0,
      paymentHistory: [],
      deliveryDate: values.deliveryDate
        ? Timestamp.fromDate(parseScheduledAt(values.deliveryDate).toDate())
        : undefined,
      estimatedDuration: parseInt(values.estimatedDuration, 10),
      paymentStatus: values.paymentStatus,
      status: values.status,
      notes: values.notes || undefined,
    };
    await onSubmit(dto);
  };

  return (
    <FormProvider {...methods}>
      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
        <ScrollView
          ref={scrollViewRef}
          className="flex-1 px-4"
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: insets.bottom }}
        >
          <View onLayout={storeY("clientName")}>
            <Controller
              control={control}
              name="clientName"
              rules={{ required: "Ingresa el nombre del cliente" }}
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Nombre del cliente"
                  placeholder="Nombre del cliente"
                  value={value}
                  onChangeText={onChange}
                  onFocus={() => scrollTo("clientName")}
                  error={errors.clientName?.message}
                />
              )}
            />
          </View>

          <View onLayout={storeY("clientPhone")}>
            <Controller
              control={control}
              name="clientPhone"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Teléfono"
                  placeholder="+56 9 1234 5678"
                  value={value}
                  onChangeText={onChange}
                  onFocus={() => scrollTo("clientPhone")}
                  keyboardType="phone-pad"
                />
              )}
            />
          </View>

          <View onLayout={storeY("items")} className="mb-2">
            <Text className="text-sm font-medium text-neutral-700 mb-2">
              Servicios
            </Text>
            {fields.map((field, index) => (
              <ItemWatcher
                key={field.id}
                index={index}
                control={control as Control<any>}
                errors={errors as FieldErrors<any>}
                onRemove={() => remove(index)}
                isOnly={fields.length === 1}
              />
            ))}
            {typeof (errors.items as any)?.root?.message === "string" && (
              <Text className="text-xs text-red-600 mb-2">
                {(errors.items as any).root.message}
              </Text>
            )}
            <Pressable
              onPress={() =>
                append({ type: "casa", label: "Casa", qty: "1", unitPrice: "" })
              }
              className="self-start px-3 py-2 rounded-xl border border-primary-600 mb-2"
            >
              <Text className="text-primary-600 text-sm font-medium">
                + Agregar servicio
              </Text>
            </Pressable>
            <View className="flex-row justify-between items-center bg-neutral-50 rounded-xl px-3 py-2 mb-2">
              <Text className="text-sm font-medium text-neutral-600">
                Total
              </Text>
              <Text className="text-base font-bold text-neutral-900">
                {formatCLP(computedTotal)}
              </Text>
            </View>
          </View>

          <View onLayout={storeY("address")}>
            <Controller
              control={control}
              name="address"
              rules={{ required: "Ingresa la dirección" }}
              render={({ field: { onChange, value } }) => (
                <AddressAutocomplete
                  label="Dirección"
                  placeholder="Av. Providencia 1234"
                  value={value ?? ""}
                  onChangeText={onChange}
                  onSelect={({ address, commune, lat, lng }) => {
                    onChange(address);
                    setValue("commune", commune || "Santiago");
                    coordinatesRef.current = { lat, lng };
                  }}
                  error={errors.address?.message}
                />
              )}
            />
          </View>

          <Controller
            control={control}
            name="scheduledAt"
            rules={{
              required: "Selecciona fecha y hora",
              validate: (v) =>
                parseScheduledAt(v).isValid() || "Fecha inválida",
            }}
            render={({ field: { onChange, value } }) => (
              <DateTimePickerField
                label="Fecha y hora"
                value={value ?? ""}
                onChange={onChange}
                error={errors.scheduledAt?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="deliveryDate"
            rules={{
              validate: (v) => {
                if (!v) return true;
                const scheduled = getValues("scheduledAt");
                if (!scheduled) return true;
                return (
                  parseScheduledAt(v).isAfter(parseScheduledAt(scheduled)) ||
                  "La fecha de entrega debe ser posterior a la fecha de la cita"
                );
              },
            }}
            render={({ field: { onChange, value } }) => (
              <DateTimePickerField
                label="Fecha de entrega (opcional)"
                value={value ?? ""}
                onChange={onChange}
                error={errors.deliveryDate?.message}
              />
            )}
          />

          <View onLayout={storeY("estimatedDuration")}>
            <Controller
              control={control}
              name="estimatedDuration"
              rules={{ required: "Ingresa la duración" }}
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Duración (minutos)"
                  placeholder="60"
                  value={value}
                  onChangeText={onChange}
                  onFocus={() => scrollTo("estimatedDuration")}
                  keyboardType="numeric"
                  error={errors.estimatedDuration?.message}
                />
              )}
            />
          </View>

          <View onLayout={storeY("notes")}>
            <Controller
              control={control}
              name="notes"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Notas (opcional)"
                  placeholder="Instrucciones especiales..."
                  value={value}
                  onChangeText={onChange}
                  onFocus={() => scrollTo("notes")}
                  multiline
                  numberOfLines={3}
                />
              )}
            />
          </View>

          <Button
            label={submitLabel}
            onPress={handleSubmit(handleFormSubmit)}
            isLoading={isLoading}
            fullWidth
            className={onFinalize ? "mt-4 mb-3" : "mt-4 mb-8"}
          />
          {onFinalize && (
            <Button
              label="Finalizar servicio"
              variant="success"
              onPress={onFinalize}
              isLoading={isFinalizing}
              disabled={isLoading}
              fullWidth
              className="mb-8"
            />
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </FormProvider>
  );
}

function ItemWatcher({
  index,
  control,
  errors,
  onRemove,
  isOnly,
}: {
  index: number;
  control: Control<any>;
  errors: FieldErrors<any>;
  onRemove: () => void;
  isOnly: boolean;
}) {
  const watchType = useWatch({
    control,
    name: `items.${index}.type`,
  }) as ServiceType;
  return (
    <ItemRow
      index={index}
      control={control}
      errors={errors}
      onRemove={onRemove}
      isOnly={isOnly}
      watchType={watchType}
    />
  );
}
