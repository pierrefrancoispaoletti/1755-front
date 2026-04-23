# Unification 1755-front + 1755-resas (Capacitor) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fusionner `1755-resas` (app de réservation Capacitor iOS/Android) dans `1755-front` pour obtenir un seul codebase produisant web + iOS + Android depuis la même source, avec la partie réservation restylée au DS actuel. Conserve l'`appId` `com.baravin1755` pour la continuité des stores.

**Architecture:** `1755-front` absorbe Capacitor et les dossiers natifs `ios/`/`android/` existants. Les pages de `1755-resas` deviennent `/reserver` (public) et `/admin/bookings` (admin). Le back `le-1755.herokuapp.com` reste inchangé (il expose déjà `/api/bookings/*` et `/api/config/*`). La tab "Résa" de la BottomAppBar passe d'un lien externe à une route interne. Dans l'admin BottomAppBar, "Thèmes" est remplacé par "Résas". Push notifications natives conservées via `@capacitor/push-notifications`. Web Push = Phase 2 (plan séparé).

**Tech Stack:** React 17 + CRA 4 + react-router 5 (HashRouter) — déjà en place. Ajouts : `@capacitor/core`, `@capacitor/ios`, `@capacitor/android`, `@capacitor/push-notifications`, `@capacitor/cli`. Aucun framework de test (convention projet — vérification manuelle via `npm start` + browser + `npx cap sync` + Xcode/Android Studio).

**Convention de vérification** : ce projet n'a pas de Jest/Mocha (cf. CLAUDE.md). Chaque task termine par une vérification manuelle : parse JSX, `npm start`, navigateur / Playwright MCP si dispo, et pour les tasks natives : `npx cap sync` + build Xcode / Android Studio. Pas de tests automatisés à écrire.

**Hors scope (Phase 2, plan séparé)** :
- Web Push (Service Worker + VAPID + subscriptions web côté back).
- Suppression définitive du repo `1755-resas` (à faire après validation en prod).

---

## File Structure

### Nouveaux fichiers

- `capacitor.config.json` — config Capacitor (appId, appName, webDir=build).
- `ios/` — dossier natif copié depuis `1755-resas/ios` (Swift + Xcode project).
- `android/` — dossier natif copié depuis `1755-resas/android` (Gradle project).
- `src/services/bookingsApi.js` — wrappers axios pour `/api/bookings/*`.
- `src/services/configApi.js` — wrappers axios pour `/api/config/*`.
- `src/services/pushNotifications.js` — hook `useNativePushRegistration()` (native-only no-op sur web).
- `src/services/dateUtils.js` — `calculateDate(date)` et `bookingsFilter(arr, calcFn, filter)` portés de resas.
- `src/pages/Reservation/index.jsx` — page `/reserver` publique, formulaire DS.
- `src/pages/Reservation/reservation.css` — styles DS.
- `src/pages/Admin/Bookings.jsx` — page `/admin/bookings`.
- `src/pages/Admin/bookings.css` — styles page admin bookings.
- `src/components/Small/BookingCard/index.jsx` — carte booking en DS (remplace `BookingItem` + `BookingControls` fusionnés).
- `src/components/Small/BookingCard/bookingCard.css`.
- `src/components/Small/BookingFilters/index.jsx` — pills de filtre (Aujourd'hui / Demain / À venir / Passées), remplace `FilterButtons`.
- `src/components/Small/ResaSwitch/index.jsx` — toggle "Réservations ouvertes/fermées" admin (remplace `BookingSwitch`).

### Fichiers modifiés

- `package.json` — ajout deps Capacitor + script `cap:sync`.
- `.gitignore` — ignorer `ios/App/Pods/`, `ios/App/build/`, `android/.gradle/`, `android/build/`, `android/app/build/` (cf. `1755-resas/.gitignore`).
- `src/components/App/App.js` — nouvelles routes `/reserver` et `/admin/bookings`, appel de `useNativePushRegistration()`.
- `src/components/Small/BottomAppBar/index.jsx` — tab "Résa" en `history.push('/reserver')`, tab admin "Thèmes" remplacée par "Résas" → `/admin/bookings`.
- `CLAUDE.md` — section Capacitor + nouveau plan 5 dans la liste.
- `README.md` — commandes iOS/Android + note build.
- `src/_const/_const.js` — exporter `RESA_PUSH_STORAGE_KEY` pour unifier la clé de registration token.

### Fichiers non-utilisés à supprimer au cleanup final (Task 10)

- Aucun dans cette PR : l'ancien `RESA_URL` dans `BottomAppBar` est supprimé par modification, pas par suppression de fichier.

---

## Task 1 : Dépendances Capacitor + config racine

**Files:**
- Modify: `/Users/pierrefrancoispaoletti/appdevelopment/1755-front/package.json`
- Create: `/Users/pierrefrancoispaoletti/appdevelopment/1755-front/capacitor.config.json`
- Modify: `/Users/pierrefrancoispaoletti/appdevelopment/1755-front/.gitignore`

- [ ] **Step 1 : Installer les deps Capacitor (versions strictement alignées sur 1755-resas pour éviter des régressions sur les projets natifs existants)**

```bash
cd /Users/pierrefrancoispaoletti/appdevelopment/1755-front
npm install --save @capacitor/core@^4.0.0 @capacitor/ios@^4.0.0 @capacitor/android@^4.0.0 @capacitor/push-notifications@^4.0.0
npm install --save-dev @capacitor/cli@^4.0.0
```

Attendu : installation OK, `package.json` contient les 5 deps, `package-lock.json` régénéré.

- [ ] **Step 2 : Créer `capacitor.config.json` (copie de `1755-resas/capacitor.config.json` avec appName mis à jour)**

```json
{
  "appId": "com.baravin1755",
  "appName": "Baravin 1755",
  "bundledWebRuntime": false,
  "npmClient": "npm",
  "webDir": "build",
  "plugins": {
    "SplashScreen": {
      "launchShowDuration": 0
    },
    "PushNotifications": {
      "presentationOptions": ["badge", "sound", "alert"]
    }
  },
  "cordova": {},
  "server": { "allowNavigation": ["le-1755.herokuapp.com/*"] }
}
```

Note : `appId` conservé strictement (`com.baravin1755`) pour la continuité stores. `appName` mis à jour vers "Baravin 1755" pour cohérence (l'ancien "1755 RESA" ne reflétait que la partie résa).

- [ ] **Step 3 : Ajouter un script npm `cap:sync`**

Dans `package.json` section `scripts`, ajouter après `deploy` :

```json
"cap:sync": "npm run build && npx cap sync"
```

- [ ] **Step 4 : Étendre `.gitignore` pour les artefacts natifs**

Ajouter à la fin de `.gitignore` :

```
# Capacitor native builds
ios/App/Pods/
ios/App/build/
ios/App/DerivedData/
android/.gradle/
android/build/
android/app/build/
android/app/release/
android/local.properties
android/.idea/
```

- [ ] **Step 5 : Vérifier que `npm start` fonctionne toujours**

```bash
cd /Users/pierrefrancoispaoletti/appdevelopment/1755-front
npm start
```

Attendu : dev server démarre, l'app se charge sur `http://localhost:3000`, aucune erreur console liée à Capacitor.

- [ ] **Step 6 : Commit**

```bash
git add package.json package-lock.json capacitor.config.json .gitignore
git -c commit.gpgsign=false commit -m "feat(capacitor): add deps and web config for native build"
```

---

## Task 2 : Importer les dossiers natifs iOS / Android

**Files:**
- Create: `/Users/pierrefrancoispaoletti/appdevelopment/1755-front/ios/` (copié depuis `1755-resas/ios`)
- Create: `/Users/pierrefrancoispaoletti/appdevelopment/1755-front/android/` (copié depuis `1755-resas/android`)

**Why** : les projets natifs de `1755-resas` sont déjà liés au `bundleId` `com.baravin1755` et à l'app store (iOS + Android). Les re-créer via `npx cap add ios` casserait la continuité (nouveau keystore, nouveau provisioning profile, etc.). On les copie tels quels, puis on laisse `npx cap sync` mettre à jour les fichiers de bridge Capacitor côté natif selon le nouvel emplacement du projet web.

- [ ] **Step 1 : Copier les dossiers natifs (hors build artifacts)**

```bash
cd /Users/pierrefrancoispaoletti/appdevelopment/1755-front
rsync -a --exclude='Pods' --exclude='build' --exclude='DerivedData' --exclude='*.xcworkspace/xcuserdata' /Users/pierrefrancoispaoletti/appdevelopment/1755-resas/ios/ ./ios/
rsync -a --exclude='.gradle' --exclude='build' --exclude='app/build' --exclude='.idea' --exclude='local.properties' /Users/pierrefrancoispaoletti/appdevelopment/1755-resas/android/ ./android/
```

Attendu : `ls ios/App/App.xcworkspace` et `ls android/app/build.gradle` retournent les fichiers natifs attendus.

- [ ] **Step 2 : Vérifier `ios/App/App/Info.plist` pointe bien sur `com.baravin1755`**

```bash
grep -A1 "CFBundleIdentifier" /Users/pierrefrancoispaoletti/appdevelopment/1755-front/ios/App/App/Info.plist
```

Attendu : voir `com.baravin1755` (ou une variable `$(PRODUCT_BUNDLE_IDENTIFIER)` résolvant vers `com.baravin1755` dans le project.pbxproj). Si divergence, ne PAS modifier — flagger au user avant de continuer.

- [ ] **Step 3 : Vérifier `android/app/build.gradle` applicationId = `com.baravin1755`**

```bash
grep "applicationId" /Users/pierrefrancoispaoletti/appdevelopment/1755-front/android/app/build.gradle
```

Attendu : `applicationId "com.baravin1755"`.

- [ ] **Step 4 : `npx cap sync` à blanc (build web préalable)**

```bash
cd /Users/pierrefrancoispaoletti/appdevelopment/1755-front
NODE_OPTIONS=--openssl-legacy-provider npm run build
npx cap sync
```

Attendu : `npm run build` produit `build/`, `npx cap sync` affiche `✔ Copying web assets` et `✔ Updating iOS plugins` / `✔ Updating Android plugins`, zéro erreur. Si un plugin Capacitor non-listé est détecté, STOP et demander au user.

- [ ] **Step 5 : Commit**

```bash
git add ios android
git -c commit.gpgsign=false commit -m "feat(capacitor): import iOS/Android native projects from 1755-resas (same appId)"
```

---

## Task 3 : Services API bookings + config + dateUtils

**Files:**
- Create: `src/services/bookingsApi.js`
- Create: `src/services/configApi.js`
- Create: `src/services/dateUtils.js`

- [ ] **Step 1 : Créer `src/services/bookingsApi.js`**

```js
import axios from "axios";
import { $SERVER } from "../_const/_const";

const authHeader = () => ({
  Authorization: `Bearer ${localStorage.getItem("token-1755") || ""}`,
});

export async function fetchAllBookings() {
  const { data } = await axios.get(`${$SERVER}/api/bookings/allBookings`, {
    headers: authHeader(),
  });
  return data?.bookings || [];
}

export async function createBooking(booking, pushNotificationToken = "") {
  const { data } = await axios.post(`${$SERVER}/api/bookings/createBooking`, {
    booking,
    pushNotificationToken,
  });
  return data;
}

export async function updateBooking(update) {
  const { data } = await axios.post(
    `${$SERVER}/api/bookings/updateBooking`,
    { update },
    { headers: authHeader() }
  );
  return data;
}

export async function deleteBooking(update) {
  const { data } = await axios.delete(`${$SERVER}/api/bookings/deleteBooking`, {
    headers: authHeader(),
    data: { update },
  });
  return data;
}

export async function postAdminRegistrationToken(registrationKey) {
  const { data } = await axios.post(
    `${$SERVER}/api/bookings/registrationToken`,
    { registrationKey },
    { headers: authHeader() }
  );
  return data;
}
```

- [ ] **Step 2 : Créer `src/services/configApi.js`**

```js
import axios from "axios";
import { $SERVER } from "../_const/_const";

export async function fetchConfig() {
  const { data } = await axios.get(`${$SERVER}/api/config/getConfig`);
  return data?.config || {};
}

export async function updateConfig(update) {
  const token = localStorage.getItem("token-1755") || "";
  const { data } = await axios.post(
    `${$SERVER}/api/config/updateConfig`,
    { update },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return data?.updatedConfig || null;
}
```

- [ ] **Step 3 : Créer `src/services/dateUtils.js`**

```js
// Retourne [bucket, label] — bucket ∈ { -1 (passé), 0 (aujourd'hui), 1 (demain), 2 (à venir) }
export function calculateDate(date) {
  const oneDay = 24 * 60 * 60 * 1000;
  const d = new Date(new Date(date).toISOString().split("T")[0]);
  const now = new Date(new Date().toISOString().split("T")[0]);
  const diff = Math.round((d - now) / oneDay);
  if (diff === 0) return [0, "Aujourd'hui"];
  if (diff === 1) return [1, "Demain"];
  if (diff < 0) return [-1, `Il y a ${Math.abs(diff)} jour${Math.abs(diff) > 1 ? "s" : ""}`];
  return [2, `Dans ${diff} jours`];
}

export function bookingsFilter(bookings, bucket) {
  return bookings.filter((b) => calculateDate(b.bookingDate)[0] === bucket);
}
```

- [ ] **Step 4 : Parse JSX / JS des 3 fichiers**

```bash
cd /Users/pierrefrancoispaoletti/appdevelopment/1755-front
for f in src/services/bookingsApi.js src/services/configApi.js src/services/dateUtils.js; do
  node -e "require('@babel/parser').parse(require('fs').readFileSync('$f','utf8'), {sourceType:'module', plugins:['jsx']})" && echo "OK: $f"
done
```

Attendu : `OK: ...` pour chaque fichier.

- [ ] **Step 5 : Commit**

```bash
git add src/services/bookingsApi.js src/services/configApi.js src/services/dateUtils.js
git -c commit.gpgsign=false commit -m "feat(services): bookingsApi + configApi + dateUtils for resa unification"
```

---

## Task 4 : Hook push notifications natives

**Files:**
- Create: `src/services/pushNotifications.js`
- Modify: `src/components/App/App.js`

**Why** : sur web, `Capacitor.isNativePlatform()` renvoie `false`, le hook devient no-op et n'importe rien de `@capacitor/push-notifications` (via import dynamique) — zéro impact sur le bundle web. Web Push = Phase 2.

- [ ] **Step 1 : Créer `src/services/pushNotifications.js`**

```js
import { useEffect, useState } from "react";

export function useNativePushRegistration() {
  const [token, setToken] = useState("");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const { Capacitor } = await import("@capacitor/core");
      if (!Capacitor.isNativePlatform()) return;

      const { PushNotifications } = await import("@capacitor/push-notifications");

      const permission = await PushNotifications.requestPermissions();
      if (permission.receive !== "granted") return;

      await PushNotifications.register();

      PushNotifications.addListener("registration", (t) => {
        if (!cancelled) setToken(t.value);
      });
      PushNotifications.addListener("registrationError", () => {});
      PushNotifications.addListener("pushNotificationReceived", () => {});
      PushNotifications.addListener("pushNotificationActionPerformed", () => {});
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return token;
}
```

- [ ] **Step 2 : Wirer le hook dans `App.js`**

Dans `/Users/pierrefrancoispaoletti/appdevelopment/1755-front/src/components/App/App.js`, après les imports existants ajouter :

```js
import { useNativePushRegistration } from "../../services/pushNotifications";
```

Dans le composant `App`, après les `useState` et avant le premier `useEffect`, ajouter :

```js
const pushNotificationToken = useNativePushRegistration();
```

Passer ensuite `pushNotificationToken` en props aux routes qui l'utilisent (voir Tasks 5 et 6).

- [ ] **Step 3 : Vérifier que l'app démarre sans erreur**

```bash
cd /Users/pierrefrancoispaoletti/appdevelopment/1755-front
npm start
```

Ouvrir `http://localhost:3000`. Attendu : app charge, console sans erreur. Le hook doit détecter non-native et ne rien faire (aucun import de `@capacitor/push-notifications` déclenché).

- [ ] **Step 4 : Commit**

```bash
git add src/services/pushNotifications.js src/components/App/App.js
git -c commit.gpgsign=false commit -m "feat(push): native-only push registration hook (web no-op)"
```

---

## Task 5 : Page `/reserver` publique + formulaire DS

**Files:**
- Create: `src/pages/Reservation/index.jsx`
- Create: `src/pages/Reservation/reservation.css`
- Modify: `src/components/App/App.js`

- [ ] **Step 1 : Créer `src/pages/Reservation/reservation.css`**

```css
.reservation {
  max-width: 520px;
  margin: 0 auto;
  padding: var(--ds-space-5, 24px) var(--ds-space-4, 16px);
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-4, 16px);
}

.reservation__closed {
  text-align: center;
  padding: var(--ds-space-6, 32px) var(--ds-space-4, 16px);
  background: var(--ds-bg-elevated, #241820);
  border-radius: var(--ds-radius-md, 16px);
  color: var(--ds-text-primary, #F5EFE8);
  font-family: var(--ds-font-serif, "DM Serif Display", Georgia, serif);
  font-size: var(--ds-size-h2, 18px);
}

.reservation__title {
  font-family: var(--ds-font-serif, "DM Serif Display", Georgia, serif);
  color: var(--ds-accent-gold, #D4A24C);
  font-size: var(--ds-size-h1, 22px);
  margin: 0 0 var(--ds-space-2, 8px);
  text-align: center;
}

.reservation__subtitle {
  color: var(--ds-text-muted, #9A8B90);
  text-align: center;
  margin: 0 0 var(--ds-space-3, 12px);
  font-size: var(--ds-size-small, 13px);
}

.reservation__success,
.reservation__error {
  text-align: center;
  padding: var(--ds-space-5, 24px);
  border-radius: var(--ds-radius-md, 16px);
  background: var(--ds-bg-elevated, #241820);
}

.reservation__success { color: var(--ds-accent-gold, #D4A24C); }
.reservation__error { color: var(--ds-accent-wine, #7B2E3E); }

.reservation__field {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-1, 4px);
}

.reservation__field label {
  color: var(--ds-text-muted, #9A8B90);
  font-size: var(--ds-size-small, 13px);
}

.reservation__field input {
  background: var(--ds-bg-elevated, #241820);
  border: 1px solid var(--ds-border, rgba(255,255,255,0.08));
  border-radius: var(--ds-radius-sm, 10px);
  color: var(--ds-text-primary, #F5EFE8);
  padding: 12px;
  font-size: var(--ds-size-body, 15px);
  font-family: inherit;
}

.reservation__field input:focus {
  outline: none;
  border-color: var(--ds-accent-gold, #D4A24C);
}

.reservation__hint {
  color: var(--ds-accent-gold, #D4A24C);
  font-size: var(--ds-size-small, 13px);
  text-align: center;
  margin-top: var(--ds-space-1, 4px);
}
```

- [ ] **Step 2 : Créer `src/pages/Reservation/index.jsx`**

```jsx
import React, { useEffect, useState } from "react";
import { Button } from "../../design-system";
import { createBooking, postAdminRegistrationToken } from "../../services/bookingsApi";
import { fetchConfig } from "../../services/configApi";
import "./reservation.css";

const emptyBooking = {
  bookerName: "",
  bookerEmail: "",
  bookerPhoneNumber: "",
  bookerNumber: "",
  bookingDate: "",
  bookingTime: "18:00",
};

const Reservation = ({ setAppMessage, pushNotificationToken }) => {
  const [booking, setBooking] = useState(emptyBooking);
  const [config, setConfig] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    const today = new Date();
    const dd = `0${today.getDate()}`.slice(-2);
    const mm = `0${today.getMonth() + 1}`.slice(-2);
    setBooking((b) => ({ ...b, bookingDate: `${today.getFullYear()}-${mm}-${dd}` }));
    fetchConfig().then(setConfig).catch(() => setConfig({}));
  }, []);

  const onField = (e) => setBooking((b) => ({ ...b, [e.target.name]: e.target.value }));

  const reset = () => {
    setBooking(emptyBooking);
    setSuccess(false);
    setError(false);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await createBooking(booking, pushNotificationToken || "");
      if (res?.status === 200) {
        setSuccess(true);
        setError(false);
        setAppMessage && setAppMessage({ success: true, message: res.message || "Réservation envoyée" });
      } else {
        setError(true);
        setSuccess(false);
        setAppMessage && setAppMessage({ success: false, message: "Erreur lors de la réservation" });
      }
    } catch {
      setError(true);
      setAppMessage && setAppMessage({ success: false, message: "Erreur lors de la réservation" });
    } finally {
      setLoading(false);
    }
  };

  if (!config.resaOpen && Object.keys(config).length > 0) {
    return (
      <div className="reservation">
        <div className="reservation__closed">
          Les réservations sont désactivées pour le moment.<br />
          Revenez plus tard !
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="reservation">
        <div className="reservation__success">
          ✓ Votre réservation a été envoyée.<br />
          Vous recevrez un email de confirmation.
        </div>
        <Button variant="ghost" block onClick={reset}>Nouvelle réservation</Button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="reservation">
        <div className="reservation__error">
          Un problème est survenu. Veuillez réessayer.
        </div>
        <Button variant="primary" block onClick={reset}>Réessayer</Button>
      </div>
    );
  }

  const invalid =
    loading ||
    !booking.bookerName ||
    !booking.bookerEmail ||
    !booking.bookerPhoneNumber ||
    !booking.bookerNumber ||
    !booking.bookingDate ||
    !booking.bookingTime;

  return (
    <form className="reservation" onSubmit={onSubmit}>
      <h1 className="reservation__title">Réserver une table</h1>
      <p className="reservation__subtitle">Baravin 1755 — Ajaccio</p>

      <div className="reservation__field">
        <label htmlFor="bookerName">Votre nom</label>
        <input id="bookerName" name="bookerName" value={booking.bookerName} autoComplete="name" type="text" placeholder="Nom et prénom" onChange={onField} required />
      </div>

      <div className="reservation__field">
        <label htmlFor="bookerEmail">Email</label>
        <input id="bookerEmail" name="bookerEmail" value={booking.bookerEmail} autoComplete="email" type="email" placeholder="vous@exemple.fr" onChange={onField} required />
      </div>

      <div className="reservation__field">
        <label htmlFor="bookerPhoneNumber">Téléphone</label>
        <input id="bookerPhoneNumber" name="bookerPhoneNumber" value={booking.bookerPhoneNumber} autoComplete="tel" type="tel" placeholder="06 ..." onChange={onField} required />
      </div>

      <div className="reservation__field">
        <label htmlFor="bookerNumber">Nombre de personnes</label>
        <input id="bookerNumber" name="bookerNumber" value={booking.bookerNumber} min={1} step={1} type="number" placeholder="4" onChange={onField} required />
      </div>

      <div className="reservation__field">
        <label htmlFor="bookingDate">Date</label>
        <input id="bookingDate" name="bookingDate" value={booking.bookingDate} type="date" onChange={onField} required />
      </div>

      <div className="reservation__field">
        <label htmlFor="bookingTime">Heure</label>
        <input id="bookingTime" name="bookingTime" value={booking.bookingTime} type="time" onChange={onField} required />
        <span className="reservation__hint">Minimum 18h00</span>
      </div>

      <Button variant="primary" block type="submit" disabled={invalid}>
        {loading ? "Envoi…" : "Je réserve"}
      </Button>
    </form>
  );
};

export default Reservation;
```

- [ ] **Step 3 : Ajouter la route `/reserver` dans `App.js`**

Dans `/Users/pierrefrancoispaoletti/appdevelopment/1755-front/src/components/App/App.js`, importer :

```js
import Reservation from "../../pages/Reservation";
```

Et ajouter la route dans le `<Switch>` (avant les routes `/admin`) :

```jsx
<Route path="/reserver">
  <Reservation
    setAppMessage={setAppMessage}
    pushNotificationToken={pushNotificationToken}
  />
</Route>
```

- [ ] **Step 4 : Parse JSX**

```bash
cd /Users/pierrefrancoispaoletti/appdevelopment/1755-front
node -e "require('@babel/parser').parse(require('fs').readFileSync('src/pages/Reservation/index.jsx','utf8'), {sourceType:'module', plugins:['jsx']})" && echo OK
```

Attendu : `OK`.

- [ ] **Step 5 : Test manuel**

```bash
npm start
```

Ouvrir `http://localhost:3000/#/reserver`. Attendu : formulaire DS s'affiche (palette sombre, accent or), dates pré-remplies, bouton désactivé tant que champs vides. Remplir, soumettre — vérifier dans le Network tab le POST vers `/api/bookings/createBooking`.

- [ ] **Step 6 : Commit**

```bash
git add src/pages/Reservation src/components/App/App.js
git -c commit.gpgsign=false commit -m "feat(public): page /reserver avec formulaire DS"
```

---

## Task 6 : Page admin `/admin/bookings` + BookingCard + BookingFilters + ResaSwitch

**Files:**
- Create: `src/components/Small/BookingCard/index.jsx`
- Create: `src/components/Small/BookingCard/bookingCard.css`
- Create: `src/components/Small/BookingFilters/index.jsx`
- Create: `src/components/Small/ResaSwitch/index.jsx`
- Create: `src/pages/Admin/Bookings.jsx`
- Create: `src/pages/Admin/bookings.css`
- Modify: `src/components/App/App.js`

- [ ] **Step 1 : Créer `src/components/Small/BookingFilters/index.jsx`**

```jsx
import React from "react";
import { bookingsFilter } from "../../../services/dateUtils";

const FILTERS = [
  { value: 0, label: "Aujourd'hui" },
  { value: 1, label: "Demain" },
  { value: 2, label: "À venir" },
  { value: -1, label: "Passées" },
];

const BookingFilters = ({ filter, setFilter, bookings }) => (
  <div className="admin-prod__filters" style={{ marginBottom: "var(--ds-space-3, 12px)" }}>
    <div className="admin-prod__filter-pills">
      {FILTERS.map((f) => {
        const count = bookingsFilter(bookings, f.value).length;
        const active = filter === f.value;
        return (
          <button
            key={f.value}
            type="button"
            className={`admin-prod__filter-pill${active ? " admin-prod__filter-pill--active" : ""}`}
            onClick={() => setFilter(f.value)}
          >
            {f.label} ({count})
          </button>
        );
      })}
    </div>
  </div>
);

export default BookingFilters;
```

- [ ] **Step 2 : Créer `src/components/Small/ResaSwitch/index.jsx`**

```jsx
import React from "react";
import { Button, ICON_MAP } from "../../../design-system";

const ResaSwitch = ({ resaOpen, onToggle, loading }) => (
  <div style={{
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "var(--ds-space-3, 12px)",
    background: "var(--ds-bg-elevated, #241820)",
    borderRadius: "var(--ds-radius-md, 16px)",
    marginBottom: "var(--ds-space-3, 12px)",
  }}>
    <span style={{ color: "var(--ds-text-primary, #F5EFE8)" }}>
      Réservations {resaOpen ? "ouvertes" : "fermées"}
    </span>
    <Button variant={resaOpen ? "danger" : "primary"} onClick={onToggle} disabled={loading}>
      {resaOpen ? <><ICON_MAP.Lock size={14} /> Fermer</> : <><ICON_MAP.Unlock size={14} /> Ouvrir</>}
    </Button>
  </div>
);

export default ResaSwitch;
```

- [ ] **Step 3 : Créer `src/components/Small/BookingCard/bookingCard.css`**

```css
.booking-card {
  background: var(--ds-bg-elevated, #241820);
  border-radius: var(--ds-radius-md, 16px);
  padding: var(--ds-space-3, 12px);
  margin-bottom: var(--ds-space-2, 8px);
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-2, 8px);
  border-left: 3px solid var(--ds-border, rgba(255,255,255,0.08));
}

.booking-card--validated { border-left-color: var(--ds-accent-gold, #D4A24C); }
.booking-card--rejected { border-left-color: var(--ds-accent-wine, #7B2E3E); opacity: 0.7; }

.booking-card__head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: var(--ds-space-2, 8px);
}

.booking-card__name {
  font-family: var(--ds-font-serif, "DM Serif Display", Georgia, serif);
  color: var(--ds-text-primary, #F5EFE8);
  font-size: var(--ds-size-h2, 18px);
  margin: 0;
}

.booking-card__when {
  color: var(--ds-accent-gold, #D4A24C);
  font-size: var(--ds-size-small, 13px);
}

.booking-card__meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--ds-space-3, 12px);
  color: var(--ds-text-muted, #9A8B90);
  font-size: var(--ds-size-small, 13px);
}

.booking-card__meta a {
  color: var(--ds-text-muted, #9A8B90);
  text-decoration: none;
}
.booking-card__meta a:hover { color: var(--ds-accent-gold, #D4A24C); }

.booking-card__actions {
  display: flex;
  gap: var(--ds-space-2, 8px);
  flex-wrap: wrap;
}
```

- [ ] **Step 4 : Créer `src/components/Small/BookingCard/index.jsx`**

```jsx
import React from "react";
import { ICON_MAP } from "../../../design-system";
import { calculateDate } from "../../../services/dateUtils";
import "./bookingCard.css";

const formatTime = (t) => (t || "").slice(0, 5);
const formatDate = (d) => {
  if (!d) return "";
  const dt = new Date(d);
  return dt.toLocaleDateString("fr-FR", { weekday: "short", day: "2-digit", month: "short" });
};

const BookingCard = ({ booking, loading, onValidate, onReject, onDelete }) => {
  const validated = booking.bookingValidatedByAdmin === true;
  const rejected = booking.bookingValidatedByAdmin === false;
  const [, whenLabel] = calculateDate(booking.bookingDate);

  return (
    <div className={`booking-card${validated ? " booking-card--validated" : ""}${rejected ? " booking-card--rejected" : ""}`}>
      <div className="booking-card__head">
        <h3 className="booking-card__name">
          {booking.bookerName} — {booking.bookerNumber} pers.
        </h3>
        <span className="booking-card__when">{whenLabel} · {formatTime(booking.bookingTime)}</span>
      </div>
      <div className="booking-card__meta">
        <span>{formatDate(booking.bookingDate)}</span>
        <a href={`tel:${booking.bookerPhoneNumber}`}><ICON_MAP.Phone size={12} /> {booking.bookerPhoneNumber}</a>
        <a href={`mailto:${booking.bookerEmail}`}><ICON_MAP.Mail size={12} /> {booking.bookerEmail}</a>
      </div>
      <div className="booking-card__actions">
        {!validated && (
          <button type="button" className="admin-prod__action-btn" onClick={() => onValidate(booking)} disabled={loading}>
            <ICON_MAP.Check size={14} /> Valider
          </button>
        )}
        {!rejected && (
          <button type="button" className="admin-prod__action-btn" onClick={() => onReject(booking)} disabled={loading}>
            <ICON_MAP.X size={14} /> Refuser
          </button>
        )}
        <button type="button" className="admin-prod__action-btn admin-prod__action-btn--danger" onClick={() => onDelete(booking)} disabled={loading}>
          <ICON_MAP.Trash size={14} /> Supprimer
        </button>
      </div>
    </div>
  );
};

export default BookingCard;
```

- [ ] **Step 5 : Créer `src/pages/Admin/bookings.css`**

```css
.admin-bookings {
  padding: var(--ds-space-4, 16px);
}

.admin-bookings__empty {
  text-align: center;
  padding: var(--ds-space-5, 24px);
  color: var(--ds-text-muted, #9A8B90);
}
```

- [ ] **Step 6 : Créer `src/pages/Admin/Bookings.jsx`**

```jsx
import React, { useEffect, useState } from "react";
import {
  fetchAllBookings,
  updateBooking,
  deleteBooking,
  postAdminRegistrationToken,
} from "../../services/bookingsApi";
import { fetchConfig, updateConfig } from "../../services/configApi";
import { bookingsFilter } from "../../services/dateUtils";
import BookingCard from "../../components/Small/BookingCard";
import BookingFilters from "../../components/Small/BookingFilters";
import ResaSwitch from "../../components/Small/ResaSwitch";
import "./admin.css";
import "./bookings.css";

const Bookings = ({ setAppMessage, pushNotificationToken }) => {
  const [bookings, setBookings] = useState([]);
  const [config, setConfig] = useState({});
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState(0);

  const load = async () => {
    setLoading(true);
    try {
      const [b, c] = await Promise.all([fetchAllBookings(), fetchConfig()]);
      const sorted = [...b]
        .sort((x, y) => new Date(x.bookingDate) - new Date(y.bookingDate))
        .sort((x, y) => (y.bookingValidatedByAdmin === null) - (x.bookingValidatedByAdmin === null));
      setBookings(sorted);
      setConfig(c);
    } catch (e) {
      setAppMessage && setAppMessage({ success: false, message: "Erreur chargement" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    if (pushNotificationToken) {
      postAdminRegistrationToken(pushNotificationToken).catch(() => {});
    }
  }, [pushNotificationToken]);

  const handleValidate = (booking) => patchBooking(booking, true);
  const handleReject = (booking) => patchBooking(booking, false);

  const patchBooking = async (booking, value) => {
    setLoading(true);
    try {
      const res = await updateBooking({ ...booking, bookingValidatedByAdmin: value });
      if (res?.status === 200 && res.updatedBooking) {
        setBookings((prev) => prev.map((b) => (b._id === res.updatedBooking._id ? res.updatedBooking : b)));
        setAppMessage && setAppMessage({ success: true, message: res.message });
      }
    } catch {
      setAppMessage && setAppMessage({ success: false, message: "Erreur mise à jour" });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (booking) => {
    if (!window.confirm(`Supprimer la résa de ${booking.bookerName} ?`)) return;
    setLoading(true);
    try {
      const res = await deleteBooking(booking);
      if (res?.status === 200 && res.deletedBooking) {
        setBookings((prev) => prev.filter((b) => b._id !== res.deletedBooking._id));
        setAppMessage && setAppMessage({ success: true, message: res.message });
      }
    } catch {
      setAppMessage && setAppMessage({ success: false, message: "Erreur suppression" });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleResa = async () => {
    setLoading(true);
    try {
      const updated = await updateConfig({ _id: config._id, resaOpen: !config.resaOpen });
      if (updated) setConfig(updated);
    } catch {
      setAppMessage && setAppMessage({ success: false, message: "Erreur config" });
    } finally {
      setLoading(false);
    }
  };

  const visible = bookingsFilter(bookings, filter);

  return (
    <div className="ds-root admin-page admin-bookings">
      <h1>Réservations</h1>
      <ResaSwitch resaOpen={!!config.resaOpen} onToggle={handleToggleResa} loading={loading} />
      <BookingFilters filter={filter} setFilter={setFilter} bookings={bookings} />
      {visible.length === 0 && <div className="admin-bookings__empty">Aucune réservation.</div>}
      {visible.map((b) => (
        <BookingCard
          key={b._id}
          booking={b}
          loading={loading}
          onValidate={handleValidate}
          onReject={handleReject}
          onDelete={handleDelete}
        />
      ))}
    </div>
  );
};

export default Bookings;
```

- [ ] **Step 7 : Ajouter la route `/admin/bookings` dans `App.js`**

Dans `/Users/pierrefrancoispaoletti/appdevelopment/1755-front/src/components/App/App.js`, importer :

```js
import AdminBookings from "../../pages/Admin/Bookings";
```

Et ajouter dans le `<Switch>` après la route `/admin/events` :

```jsx
<Route path="/admin/bookings">
  <RequireAuth user={user}>
    <AdminBookings
      setAppMessage={setAppMessage}
      pushNotificationToken={pushNotificationToken}
    />
  </RequireAuth>
</Route>
```

- [ ] **Step 8 : Parse JSX des 4 fichiers créés**

```bash
cd /Users/pierrefrancoispaoletti/appdevelopment/1755-front
for f in src/components/Small/BookingCard/index.jsx src/components/Small/BookingFilters/index.jsx src/components/Small/ResaSwitch/index.jsx src/pages/Admin/Bookings.jsx; do
  node -e "require('@babel/parser').parse(require('fs').readFileSync('$f','utf8'), {sourceType:'module', plugins:['jsx']})" && echo "OK: $f"
done
```

Attendu : `OK: ...` × 4.

- [ ] **Step 9 : Test manuel**

```bash
npm start
```

Se logger admin, aller sur `http://localhost:3000/#/admin/bookings`. Vérifier : toggle résa fonctionne (check Network PATCH `/api/config/updateConfig`), filtres affichent les compteurs, cards affichent les résas existantes, boutons Valider/Refuser/Supprimer appellent les bons endpoints.

- [ ] **Step 10 : Commit**

```bash
git add src/components/Small/BookingCard src/components/Small/BookingFilters src/components/Small/ResaSwitch src/pages/Admin/Bookings.jsx src/pages/Admin/bookings.css src/components/App/App.js
git -c commit.gpgsign=false commit -m "feat(admin): page /admin/bookings avec BookingCard/Filters/ResaSwitch en DS"
```

---

## Task 7 : BottomAppBar — Résa interne + remplacer Thèmes par Résas

**Files:**
- Modify: `src/components/Small/BottomAppBar/index.jsx`

- [ ] **Step 1 : Remplacer le tab "Résa" visitor par une navigation interne**

Dans `/Users/pierrefrancoispaoletti/appdevelopment/1755-front/src/components/Small/BottomAppBar/index.jsx` :

Supprimer la ligne `const RESA_URL = ...`.

Remplacer le bloc du tab `resa` (lignes 35-41 actuellement) par :

```jsx
    {
      key: "resa",
      label: "Résa",
      icon: ICON_MAP.CalendarCheck,
      active: pathname === "/reserver",
      onClick: () => history.push("/reserver"),
    },
```

- [ ] **Step 2 : Remplacer la tab admin "Thèmes" par "Résas"**

Dans le même fichier, dans `adminTabs`, remplacer le bloc `a-themes` (lignes 77-82 actuellement) par :

```jsx
    {
      key: "a-bookings",
      label: "Résas",
      icon: ICON_MAP.CalendarCheck,
      active: pathname.startsWith("/admin/bookings"),
      onClick: () => history.push("/admin/bookings"),
    },
```

- [ ] **Step 3 : Parse JSX**

```bash
cd /Users/pierrefrancoispaoletti/appdevelopment/1755-front
node -e "require('@babel/parser').parse(require('fs').readFileSync('src/components/Small/BottomAppBar/index.jsx','utf8'), {sourceType:'module', plugins:['jsx']})" && echo OK
```

Attendu : `OK`.

- [ ] **Step 4 : Test manuel**

```bash
npm start
```

Vérifier :
- Sur `/` (visiteur), tap sur "Résa" → navigue vers `/reserver` sans ouvrir nouvel onglet.
- Sur `/admin`, la tab "Thèmes" a disparu, remplacée par "Résas", qui pointe vers `/admin/bookings`.

- [ ] **Step 5 : Commit**

```bash
git add src/components/Small/BottomAppBar/index.jsx
git -c commit.gpgsign=false commit -m "feat(nav): tab Résa interne + admin Résas remplace Thèmes"
```

---

## Task 8 : Nettoyage route `/admin/themes` + Capacitor sync final

**Files:**
- Modify: `src/components/App/App.js`

**Why** : la route `/admin/themes` n'est plus accessible via UI. Deux choix : la laisser accessible via URL directe (feature en sommeil) ou la retirer complètement. Décision prise avec le user : **remplacer Thèmes par Résas**, donc on laisse la route accessible via URL directe pour ne rien casser côté back/tests mais elle n'apparaît plus dans la nav.

- [ ] **Step 1 : Vérifier que la route `/admin/themes` reste fonctionnelle**

Lancer `npm start`, ouvrir `http://localhost:3000/#/admin/themes` manuellement (en étant loggé admin). Attendu : page `AdminThemes` charge comme avant.

Aucune modification de code nécessaire — la route existe toujours dans `App.js`, juste plus de lien dans la BottomAppBar.

- [ ] **Step 2 : Build web + Capacitor sync**

```bash
cd /Users/pierrefrancoispaoletti/appdevelopment/1755-front
NODE_OPTIONS=--openssl-legacy-provider npm run build
npx cap sync
```

Attendu :
- Build termine sans erreur (attention : si `@capacitor/*` génère des warnings CRA 4 / webpack 4, vérifier qu'aucun n'est bloquant).
- `npx cap sync` logue `✔ Copying web assets to ios/App/App/public` et `✔ Copying web assets to android/app/src/main/assets/public`.

- [ ] **Step 3 : Vérification iOS (si Xcode dispo)**

```bash
cd /Users/pierrefrancoispaoletti/appdevelopment/1755-front
npx cap open ios
```

Dans Xcode : sélectionner un simulateur iPhone, Build & Run. Attendu : l'app se lance, affiche la Home de Baravin 1755 (pas l'ancienne Home resas), la tab "Résa" en bas, tap dessus ouvre `/reserver`.

Si pas d'accès Xcode : skip et flagger au user pour test ultérieur.

- [ ] **Step 4 : Vérification Android (si Android Studio dispo)**

```bash
cd /Users/pierrefrancoispaoletti/appdevelopment/1755-front
npx cap open android
```

Dans Android Studio : sélectionner émulateur, Run. Attendu : même comportement qu'iOS.

Si pas d'accès : skip et flagger au user.

- [ ] **Step 5 : Commit (aucune modif de code — commit seulement si sync a modifié des fichiers natifs)**

```bash
git status
# si des fichiers ont changé dans ios/ ou android/ suite au sync :
git add ios android
git -c commit.gpgsign=false commit -m "chore(capacitor): sync after web build with new routes"
```

Si rien n'a changé, skip ce commit.

---

## Task 9 : CLAUDE.md + README + mémoire

**Files:**
- Modify: `CLAUDE.md`
- Modify: `README.md`
- Modify: `/Users/pierrefrancoispaoletti/.claude/projects/-Users-pierrefrancoispaoletti-appdevelopment-1755-front/memory/project_refactor_admin_2026.md`
- Modify: `/Users/pierrefrancoispaoletti/.claude/projects/-Users-pierrefrancoispaoletti-appdevelopment-1755-front/memory/MEMORY.md`

- [ ] **Step 1 : Ajouter une section Capacitor dans `CLAUDE.md`**

Après la section "## Commandes", insérer :

```markdown
### Capacitor (iOS / Android)

Depuis la fusion avec `1755-resas` (Plan 5, 2026-04-23), le repo produit aussi les binaires iOS et Android via Capacitor 4.

- `appId` : `com.baravin1755` (conservé pour continuité stores — **ne jamais changer**).
- `capacitor.config.json` à la racine, `ios/` et `android/` versionnés.
- Build natif : `npm run cap:sync` (équivaut à `npm run build && npx cap sync`).
- Ouvrir Xcode : `npx cap open ios`. Ouvrir Android Studio : `npx cap open android`.
- Push notifications : natif via `@capacitor/push-notifications` (hook `src/services/pushNotifications.js`, no-op sur web). Web Push = Phase 2 (pas implémenté).
- Tab "Résa" en BottomAppBar pointe vers `/reserver` (formulaire public). Admin tab "Résas" pointe vers `/admin/bookings`.
```

Ajouter aussi dans la section "Documentation projet" :

```markdown
- `plans/2026-04-23-plan-5-unification-capacitor.md` — unification resas + Capacitor.
```

Et dans la section "Stack", remplacer la ligne existante par :

```markdown
- React 17 + react-router 5 (HashRouter)
- CRA 4 (`react-scripts`) — build via `NODE_OPTIONS=--openssl-legacy-provider`
- Capacitor 4 (`@capacitor/core|ios|android|push-notifications`) — iOS + Android depuis 2026-04-23
- Design system maison dans `src/design-system/` ...
```

- [ ] **Step 2 : Ajouter une section Capacitor dans `README.md`**

Ajouter après la section commandes existante :

```markdown
## iOS / Android (Capacitor)

```bash
npm run cap:sync          # build web + copie dans ios/android
npx cap open ios          # ouvre Xcode
npx cap open android      # ouvre Android Studio
```

`appId` : `com.baravin1755`. Push notifs actives sur natif, Web Push non implémenté.
```

- [ ] **Step 3 : Mettre à jour `project_refactor_admin_2026.md` mémoire**

À la fin du fichier, ajouter une nouvelle section :

```markdown

**Plan 5 (unification Capacitor, 2026-04-23)** :
- Absorption de `1755-resas` dans `1755-front`.
- Capacitor 4 ajouté (`@capacitor/core|ios|android|push-notifications`), `capacitor.config.json` à la racine, `ios/` + `android/` importés tels quels depuis `1755-resas` pour conserver `appId: com.baravin1755` et la continuité stores.
- Nouvelles routes : `/reserver` (public, formulaire DS) et `/admin/bookings` (admin, liste + validate/reject/delete + toggle résaOpen).
- BottomAppBar : tab "Résa" passe d'external link (gh-pages resas) à `history.push('/reserver')`. Admin : tab "Thèmes" remplacée par "Résas" (route `/admin/themes` reste accessible via URL directe, hors nav).
- Push notifications natives via `src/services/pushNotifications.js` (hook dynamic import, no-op sur web). Web Push = Phase 2 séparée.
- Auth unifié sur `token-1755` (plus de `token-resas-1755`). Decoder maison (`services/auth.js`) remplace `jwt-decode`.
- `1755-resas` devient legacy, plus de deploy gh-pages depuis, futures versions iOS/Android depuis `1755-front`.
```

- [ ] **Step 4 : Mettre à jour `MEMORY.md` index**

Ajouter dans l'index (si pas déjà présent via la mise à jour de `project_refactor_admin_2026.md`) — vérifier que la ligne pointant vers `project_refactor_admin_2026.md` mentionne "Plan 5 Capacitor" dans son hook.

Remplacer la ligne existante `[Refonte admin + catégories DB (2026-04)]` par :

```markdown
- [Refonte admin + catégories DB + Capacitor (2026-04)](project_refactor_admin_2026.md) — feat/admin-bottom-bar-categories, Plans 1-5, Plan 5 = unification resas + Capacitor
```

- [ ] **Step 5 : Commit**

```bash
cd /Users/pierrefrancoispaoletti/appdevelopment/1755-front
git add CLAUDE.md README.md
git -c commit.gpgsign=false commit -m "docs: Capacitor unification + Plan 5 (CLAUDE.md + README)"
```

(Les mémoires sont hors repo — pas de commit pour elles.)

---

## Notes d'exécution

- **Conventions projet** : pas de tests auto (cf. CLAUDE.md). Vérification = parse JSX + `npm start` + navigateur + `npx cap sync` + simulateur si dispo.
- **`_const.js`** : la task laisse `$SERVER` intact. Le user bascule manuellement entre prod et `localhost:8080` comme d'habitude et ne commit jamais le toggle.
- **Pas de merge sur `main`** : tout reste sur `feat/admin-bottom-bar-categories`. Aucun `npm run deploy` ni `git push origin main` sans feu vert explicite.
- **Ordre des tasks** : séquentiel. Task 2 dépend de Task 1 (capacitor.config.json nécessaire avant sync). Tasks 5 et 6 peuvent être faites en parallèle si exécution multi-agents (aucune dépendance croisée). Task 7 dépend de 5+6 (les routes doivent exister). Task 8 est finale pour valider le sync complet.
- **Risque principal** : le `npx cap sync` de la Task 2 pourrait faire remonter des incompatibilités Capacitor 4 avec les versions natives actuelles. Si c'est le cas : STOP et demander au user (probablement un bump de Capacitor patch, mais à valider avec une sauvegarde du keystore Android avant toute manip).
- **Web Push (Phase 2)** : à scoper dans un plan séparé. Implique côté back : stockage `WebPushSubscription`, VAPID keys, lib `web-push`, endpoint de subscribe. Côté front : service worker, flow de subscribe, bouton UI "Activer les notifications". Gros morceau, pas inclus ici.
