import type { Appointment } from "@/domain/entities/appointment";

const futureAppointment = {
  id: "a1",
  scheduledAt: new Date(Date.now() + 72 * 3600 * 1000),
  items: [],
  location: { commune: "Providencia", address: "Calle 1" },
} as unknown as Appointment;

function loadService(executionEnvironment: string, os = "android") {
  const scheduleNotificationAsync = jest.fn().mockResolvedValue("id");
  const notificationsFactory = jest.fn(() => ({
    setNotificationHandler: jest.fn(),
    setNotificationChannelAsync: jest.fn().mockResolvedValue(undefined),
    requestPermissionsAsync: jest.fn().mockResolvedValue({ status: "granted" }),
    scheduleNotificationAsync,
    getAllScheduledNotificationsAsync: jest.fn().mockResolvedValue([]),
    cancelScheduledNotificationAsync: jest.fn(),
    AndroidImportance: { MAX: 5 },
    SchedulableTriggerInputTypes: { DATE: "date" },
  }));

  jest.doMock("react-native", () => ({ Platform: { OS: os } }));
  jest.doMock("expo-constants", () => ({
    __esModule: true,
    default: { executionEnvironment },
    ExecutionEnvironment: { StoreClient: "storeClient", Standalone: "standalone", Bare: "bare" },
  }));
  jest.doMock("expo-notifications", notificationsFactory);

  let service: typeof import("./notificationService");
  jest.isolateModules(() => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    service = require("./notificationService");
  });
  return { service: service!, notificationsFactory, scheduleNotificationAsync };
}

describe("notificationService in Expo Go on Android", () => {
  it("never loads expo-notifications (it throws on import there)", async () => {
    const { service, notificationsFactory } = loadService("storeClient");

    await expect(service.requestNotificationPermission()).resolves.toBe(false);
    await expect(service.scheduleAppointmentReminder(futureAppointment)).resolves.toBeUndefined();
    await expect(service.cancelAppointmentReminders("a1")).resolves.toBeUndefined();
    await expect(service.cancelAllAppointmentReminders()).resolves.toBeUndefined();

    expect(notificationsFactory).not.toHaveBeenCalled();
  });
});

describe("notificationService in a real build", () => {
  it("schedules reminders through expo-notifications", async () => {
    const { service, scheduleNotificationAsync } = loadService("standalone");

    await service.scheduleAppointmentReminder(futureAppointment);

    expect(scheduleNotificationAsync).toHaveBeenCalledTimes(2);
  });

  it("requests permission and reports the result", async () => {
    const { service } = loadService("standalone");

    await expect(service.requestNotificationPermission()).resolves.toBe(true);
  });
});
