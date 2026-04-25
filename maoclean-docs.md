# MaoClean — Documentación Técnica

## Resumen del Proyecto

**Propósito:** Aplicación móvil para gestionar citas de servicios de limpieza, con optimización de rutas mediante proximidad geográfica.

**Usuario objetivo:** Dueño de un negocio de limpieza (sillas, muebles, alfombras, apartamentos, casas, carros) en Santiago de Chile.

**Alcance inicial:** Un solo usuario. Diseño que permita escalar a multi-usuario en el futuro sin reescritura.

---

## Stack Tecnológico

### Frontend

| Tecnología | Versión | Justificación |
|---|---|---|
| React Native | Latest | Framework principal multiplataforma |
| Expo (SDK 52+) | Latest | Build, OTA updates, acceso a APIs nativas |
| TypeScript | 5.x | Tipado estático obligatorio |
| Expo Router | v3+ | Navegación basada en sistema de archivos |
| Zustand | 4.x | Estado global simple y predecible |
| NativeWind | 4.x | Estilos con utilidades Tailwind |
| react-hook-form | 7.x | Gestión de formularios con validación |
| dayjs | 1.x | Manejo de fechas (+ plugins: timezone, duration) |
| React Native Maps | Latest | Mapas y geolocalización |
| Expo Location | Latest | GPS del dispositivo |

### Backend

| Servicio | Función | Tier gratuito |
|---|---|---|
| Firebase Auth | Autenticación (email/password) | Unlimited |
| Firestore | Base de datos + offline sync nativa | 50k reads/día, 20k writes/día |
| Firebase Hosting | Hosting de assets estáticos | 1 GB |
| Google Maps API | Mapas y geocodificación | $200 crédito/mes (~100k requests) |

> **Por qué Firebase y no Supabase:** Firestore tiene offline sync nativa y madura. Supabase no tiene soporte offline — habría que construirlo manualmente desde cero. Para este proyecto donde "offline first" es un requisito core, Firebase es la decisión correcta. A futuro, cuando se necesiten queries SQL complejas o el proyecto escale, Supabase sería la alternativa a evaluar.

> **Por qué no TanStack Query:** Firestore usa listeners en tiempo real (`onSnapshot`) — push, no pull. TanStack Query fue diseñado para REST (fetch → cache → refetch). Usarlos juntos genera dos capas de cache en conflicto. La combinación correcta es: **Firestore `onSnapshot` → Zustand store → UI**.

---

## Arquitectura

### Principio

Clean Architecture adaptada a mobile. La regla central: **las capas internas no conocen las externas**. El dominio no sabe que existe Firebase. Firebase es un detalle de implementación.

```
┌──────────────────────────────────────────────┐
│               PRESENTACIÓN                    │
│   Screens · Componentes · Zustand Stores      │
├──────────────────────────────────────────────┤
│               APLICACIÓN                      │
│            Casos de uso (hooks)               │
├──────────────────────────────────────────────┤
│               DOMINIO                         │
│      Entidades · Interfaces · Tipos           │
├──────────────────────────────────────────────┤
│            INFRAESTRUCTURA                    │
│   Firebase · GPS · Geocodificación · Push     │
└──────────────────────────────────────────────┘
```

### Capas explicadas

**Dominio** — el núcleo. Solo TypeScript puro, sin imports de librerías externas. Define qué son las cosas.
- Entidades: `Appointment`, `Client`, `User`
- Interfaces: `IAppointmentRepository`, `IClientRepository`

**Infraestructura** — implementa las interfaces del dominio usando Firebase. Si mañana cambiás de Firebase a Supabase, solo tocás esta capa.

**Aplicación** — los casos de uso reales del negocio, implementados como hooks de React. Orquesta dominio + infraestructura.

**Presentación** — screens y componentes. Llaman a los hooks de aplicación, nunca a Firebase directamente.

### Flujo de datos (ejemplo: cargar citas del día)

```
HomeScreen
  → useAppointments() hook
    → appointmentRepository.getByDate()  [infraestructura]
      → Firestore onSnapshot()           [Firebase SDK]
        → Zustand store update
          → HomeScreen re-render
```

---

## Modelo de Datos (Firestore)

### Colección: `users`

```typescript
/users/{userId}
{
  id: string
  email: string
  name: string
  phone?: string
  createdAt: Timestamp
  updatedAt: Timestamp
}
```

### Colección: `clients`

> Separar clientes de citas permite ver historial, recurrencia y estadísticas por cliente.

```typescript
/clients/{clientId}
{
  id: string
  userId: string          // dueño del registro
  name: string
  phone: string
  email?: string
  notes?: string
  createdAt: Timestamp
  updatedAt: Timestamp
}
```

### Colección: `appointments`

```typescript
/appointments/{appointmentId}
{
  id: string
  userId: string           // dueño del registro
  clientId: string         // referencia a /clients/{clientId}

  serviceType: 'sillas' | 'muebles' | 'alfombra' | 'apartamento' | 'casa' | 'carro' | 'otro'

  location: {
    address: string        // texto legible: "Av. Providencia 1234"
    coordinates: GeoPoint  // { latitude, longitude }
    commune: string        // "Providencia", "Las Condes", etc.
  }

  scheduledAt: Timestamp   // fecha Y hora unificadas (no separar)
  estimatedDuration: number // minutos

  price: number
  paymentStatus: 'pending' | 'paid' | 'partial'

  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'no_show'

  notes?: string
  createdAt: Timestamp
  updatedAt: Timestamp
}
```

> **Por qué `scheduledAt` unificado:** Tener `date: timestamp` y `time: string` por separado genera bugs de timezone garantizados al comparar o filtrar. Un solo `Timestamp` de Firebase resuelve el problema limpiamente.

> **Por qué `clientId` en vez de `clientName`:** Si el cliente agenda 10 citas y su nombre está duplicado en cada una, no hay forma de ver su historial completo ni detectar clientes frecuentes. La referencia es la base de cualquier sistema de gestión.

---

## Interfaces del Dominio

```typescript
// domain/interfaces/IAppointmentRepository.ts
interface IAppointmentRepository {
  getByDate(userId: string, date: Date): Promise<Result<Appointment[]>>
  getById(id: string): Promise<Result<Appointment>>
  create(data: CreateAppointmentDTO): Promise<Result<Appointment>>
  update(id: string, data: UpdateAppointmentDTO): Promise<Result<Appointment>>
  delete(id: string): Promise<Result<void>>
  subscribeToDate(userId: string, date: Date, callback: (appointments: Appointment[]) => void): Unsubscribe
}

// domain/interfaces/IClientRepository.ts
interface IClientRepository {
  getAll(userId: string): Promise<Result<Client[]>>
  getById(id: string): Promise<Result<Client>>
  create(data: CreateClientDTO): Promise<Result<Client>>
  update(id: string, data: UpdateClientDTO): Promise<Result<Client>>
  delete(id: string): Promise<Result<void>>
}
```

---

## Manejo de Errores

### Patrón: Result type

Todos los servicios devuelven un `Result<T>` en lugar de tirar excepciones. Esto hace que los errores sean visibles en los tipos y obliga a manejarlos.

```typescript
// utils/result.ts
type Result<T> =
  | { success: true; data: T }
  | { success: false; error: string }

function ok<T>(data: T): Result<T> {
  return { success: true, data }
}

function err(error: string): Result<never> {
  return { success: false, error }
}
```

**Uso en un servicio:**

```typescript
async function createAppointment(data: CreateAppointmentDTO): Promise<Result<Appointment>> {
  try {
    const ref = await addDoc(collection(db, 'appointments'), data)
    return ok({ id: ref.id, ...data })
  } catch (e) {
    return err('No se pudo crear la cita. Intenta de nuevo.')
  }
}
```

**Uso en un store:**

```typescript
// stores/useAppointmentsStore.ts
{
  appointments: Appointment[]
  isLoading: boolean
  error: string | null     // null = sin error
}
```

**Uso en la UI:** toast o banner de error con mensaje amigable + botón "Reintentar".

---

## Estrategia Offline First

Firestore maneja offline de forma nativa. Lo que hay que configurar y entender:

```typescript
// services/firebase.ts
import { initializeFirestore, persistentLocalCache } from 'firebase/firestore'

const db = initializeFirestore(app, {
  localCache: persistentLocalCache()  // cache persistente entre sesiones
})
```

**Comportamiento:**
1. **Lectura offline:** Firestore sirve datos del cache local instantáneamente.
2. **Escritura offline:** las operaciones se encolan localmente y se sincronizan cuando vuelve la conexión.
3. **Conflictos:** Firestore usa "last write wins" — suficiente para un solo usuario.
4. **Geocodificación offline:** si no hay conexión al crear una cita, se guarda el texto de dirección. Cuando reconnecte, se geocodifica y se actualiza el `GeoPoint`.

---

## Seguridad — Firestore Rules

> Esto es CRÍTICO. Sin reglas, cualquier persona que consiga tu API key puede leer y escribir tu base de datos.

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Un usuario solo puede ver y editar su propio perfil
    match /users/{userId} {
      allow read, write: if request.auth != null
                         && request.auth.uid == userId;
    }

    // Un usuario solo puede ver y editar sus propias citas
    match /appointments/{appointmentId} {
      allow read, update, delete: if request.auth != null
                                  && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null
                    && request.auth.uid == request.resource.data.userId;
    }

    // Un usuario solo puede ver y editar sus propios clientes
    match /clients/{clientId} {
      allow read, update, delete: if request.auth != null
                                  && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null
                    && request.auth.uid == request.resource.data.userId;
    }
  }
}
```

---

## Autenticación

**Método:** Email + password únicamente (un solo usuario, simplicidad máxima).

**Flujo:**
1. App abre → Firebase verifica si hay sesión activa
2. Si hay sesión → ir a Home directamente
3. Si no hay sesión → ir a pantalla de Login
4. Firebase persiste la sesión automáticamente (no hay que manejar tokens manualmente)
5. Si la sesión expira → redirigir a Login

**No hay pantalla de registro.** El usuario se crea una sola vez directamente en la consola de Firebase o con un script de setup.

---

## Sistema de Proximidad

El feature diferenciador de la app. Detecta citas cercanas el mismo día para optimizar traslados.

```typescript
// domain/entities/proximity.ts
interface ProximitySuggestion {
  type: 'NEARBY' | 'OPTIMAL_ROUTE' | 'GROUP_BY_COMMUNE'
  message: string
  appointmentIds: string[]
  distanceKm: number
  estimatedTravelMin: number
  priority: 'high' | 'medium' | 'low'
}
```

```typescript
// services/proximityService.ts
const NEARBY_THRESHOLD_KM = 2.0

function calculateProximity(appointments: Appointment[]): ProximitySuggestion[] {
  const suggestions: ProximitySuggestion[] = []

  for (let i = 0; i < appointments.length; i++) {
    for (let j = i + 1; j < appointments.length; j++) {
      const a = appointments[i]
      const b = appointments[j]

      const distance = haversine(a.location.coordinates, b.location.coordinates)

      if (distance < NEARBY_THRESHOLD_KM) {
        suggestions.push({
          type: 'NEARBY',
          message: `Citas a solo ${distance.toFixed(1)} km`,
          appointmentIds: [a.id, b.id],
          distanceKm: distance,
          estimatedTravelMin: Math.round(distance * 3), // ~3 min/km en ciudad
          priority: distance < 1 ? 'high' : 'medium',
        })
      }
    }
  }

  return suggestions.sort((a, b) => a.distanceKm - b.distanceKm)
}
```

> El algoritmo es O(n²). Con ~4 citas por día es completamente irrelevante en términos de performance. Si en el futuro se manejan 50+ citas diarias, se puede optimizar con geohashing.

---

## Estrategia de Notificaciones

**Qué dispara una notificación:**

| Trigger | Momento | Mensaje |
|---|---|---|
| Recordatorio de cita | 24h antes | "Mañana tienes cita con {cliente} a las {hora}" |
| Recordatorio de cita | 1h antes | "En 1 hora: {servicio} en {dirección}" |
| Sugerencia de proximidad | Al crear cita | "Hay otra cita a {X} km el mismo día" |

**Implementación:** Expo Notifications. Los recordatorios se programan localmente al crear/actualizar una cita — no requieren servidor.

```typescript
// services/notificationService.ts
async function scheduleAppointmentReminder(appointment: Appointment): Promise<void> {
  const scheduledAt = dayjs(appointment.scheduledAt.toDate())

  // 24h antes
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Recordatorio de cita',
      body: `Mañana: ${appointment.serviceType} en ${appointment.location.commune}`,
    },
    trigger: { date: scheduledAt.subtract(24, 'hour').toDate() }
  })

  // 1h antes
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Cita en 1 hora',
      body: `${appointment.location.address}`,
    },
    trigger: { date: scheduledAt.subtract(1, 'hour').toDate() }
  })
}
```

---

## Estructura del Proyecto

```
/app                              # Rutas — Expo Router
  /(auth)
    - _layout.tsx
    - login.tsx
  /(tabs)
    - _layout.tsx
    - index.tsx                   # Home (citas del día)
    - citas.tsx                   # Lista de citas con filtros
    - clientes.tsx                # Lista de clientes
    - mapa.tsx                    # Mapa de citas
  /appointment
    - new.tsx                     # Crear cita
    - [id].tsx                    # Detalle de cita
    - edit/[id].tsx               # Editar cita
  /client
    - new.tsx                     # Crear cliente
    - [id].tsx                    # Detalle de cliente
  - _layout.tsx                   # Root layout (auth guard aquí)

/components
  /ui                             # Componentes base reutilizables
    - Button.tsx
    - Input.tsx
    - Badge.tsx
    - Card.tsx
    - EmptyState.tsx
    - LoadingSpinner.tsx
    - Toast.tsx
  /appointments
    - AppointmentCard.tsx
    - AppointmentForm.tsx
    - StatusBadge.tsx
    - PaymentBadge.tsx
  /clients
    - ClientCard.tsx
    - ClientForm.tsx
  /proximity
    - SuggestionCard.tsx
    - ProximityAlert.tsx
  /map
    - MapView.tsx
    - AppointmentMarker.tsx

/domain                           # Núcleo — TypeScript puro, sin dependencias externas
  /entities
    - appointment.ts
    - client.ts
    - user.ts
  /interfaces
    - IAppointmentRepository.ts
    - IClientRepository.ts

/services                         # Infraestructura — implementaciones con Firebase
  - firebase.ts                   # Config e inicialización
  - appointmentRepository.ts      # IAppointmentRepository con Firestore
  - clientRepository.ts           # IClientRepository con Firestore
  - authService.ts                # Login, logout, sesión
  - geoService.ts                 # Geocodificación (dirección ↔ coordenadas)
  - proximityService.ts           # Algoritmo Haversine + sugerencias
  - notificationService.ts        # Expo Notifications

/stores                           # Estado global — Zustand
  - useAuthStore.ts
  - useAppointmentsStore.ts
  - useClientsStore.ts
  - useProximityStore.ts

/hooks                            # Casos de uso — orquestan servicios + stores
  - useAppointments.ts
  - useClients.ts
  - useLocation.ts
  - useOffline.ts

/utils
  - result.ts                     # Tipo Result<T>, ok(), err()
  - dateUtils.ts                  # Helpers con dayjs
  - distanceUtils.ts              # Haversine
  - formatUtils.ts                # Formateo de texto y números

/constants
  - services.ts                   # Tipos de limpieza
  - communes.ts                   # 35 comunas de Santiago
  - theme.ts                      # Colores y tokens de diseño
```

---

## Costos Estimados

| Servicio | Tier Gratuito | Uso Estimado | Costo Mensual |
|---|---|---|---|
| Firebase Auth | Unlimited | 1 usuario | $0 |
| Firestore | 50k reads/día, 20k writes/día | ~200 reads/día, ~20 writes/día | $0 |
| Cloud Functions | 125k invocaciones/mes | 0 (lógica en cliente) | $0 |
| Firebase Hosting | 1 GB | Assets estáticos | $0 |
| Google Maps API | $200 crédito/mes | ~100 requests/día | $0 |
| **TOTAL** | | | **$0/mes** |

---

## Funcionalidades Futuras (Post-MVP)

1. **Multi-usuario** — empleados con roles (admin / técnico)
2. **App para clientes** — auto-agendamiento
3. **Pagos** — integración con medio de pago local
4. **Reportes** — ganancias por servicio, cliente frecuente, zona más rentable
5. **Optimización de ruta avanzada** — integración con Google Routes API

---

## Variables de Entorno

```bash
# .env (no commitear nunca)
EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
EXPO_PUBLIC_FIREBASE_APP_ID=
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=
```

---

## Comandos Útiles

```bash
# Iniciar desarrollo
npx expo start

# Build nativo (necesario para Google Maps real)
npx expo prebuild --platform android
npx expo run:android

# Verificar tipos TypeScript
npx tsc --noEmit

# Instalar dependencias
npm install
```

---

_Proyecto: MaoClean — Gestión de Citas de Limpieza (Santiago de Chile)_
_Stack: React Native · Expo · Firebase · TypeScript · NativeWind_
