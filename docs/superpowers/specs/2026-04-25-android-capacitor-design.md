# Android Capacitor — design

**Date** : 2026-04-25
**Branche cible** : `feat/android-capacitor`
**Statut** : design validé, prêt pour planification d'implémentation

## Contexte

L'app iOS de `1755-front` est en place depuis 2026-04-23 (Capacitor 8, Firebase Messaging, push notifications, target `Baravin 1755` v2.0.0 build 2). L'app Android n'a pas encore été scaffoldée sur ce repo. Le PC Windows du user porte le keystore de release et c'est la machine où tout le workflow Android sera exécuté.

Une app Android legacy existe déjà sur le Play Store sous l'`applicationId` `com.baravin1755` (projet `1755-resas`, focus réservation seule, dernière version publiée `versionCode 30` / `versionName 2.0.6`). Le projet legacy est sur ce PC à `D:\03_Projets\1755-resas` et utilise déjà Capacitor + Firebase. La nouvelle app Android v2.1.0 va **remplacer** cette app legacy sur le **même listing Play Store** (continuité utilisateurs, avis, installs).

## Objectifs

- Scaffolder une app Android Capacitor 8 propre dans `1755-front`, strictement parallèle à iOS.
- Aligner Firebase et push notifications sur la config iOS existante (projet `resas-d1707`).
- Câbler le signing release via le keystore d'upload existant.
- Publier une première release via le canal **Internal testing** Play Console pour validation sur device réel, avant promotion manuelle vers Production.

Hors-scope : CI/CD, déploiement automatisé, multi-flavors, instrumentation tests, refactor du back, refactor du hook push front (déjà multi-plateforme).

## Décisions clés

| Sujet | Valeur | Justification |
|---|---|---|
| `applicationId` | `com.baravin1755` | Continuité Play Store legacy + alignement bundleId iOS. |
| `versionCode` | `31` | Legacy à `30`, downgrade interdit par Google Play. |
| `versionName` | `2.1.0` | Marque l'unification. Divergence avec iOS `2.0.0` inévitable (downgrade Android impossible). |
| `compileSdk` | `35` | Dernière version stable, alignée targetSdk. |
| `targetSdk` | `35` | Obligatoire pour soumissions Play Store depuis août 2025. |
| `minSdk` | `23` (Android 6+) | Défaut Capacitor 8 ; couvre ~95% du parc actif. Legacy à `30` (~15%) trop restrictif pour une app vitrine restaurant. |
| Approche scaffold | Neuf (`npx cap add android`) | iOS scaffoldé proprement Capacitor 8, autant faire pareil. Pas de tweak legacy non standard à migrer. |
| Signing | `keystore.properties` + `signingConfigs.release` dans Gradle | Build CLI reproductible, credentials hors repo. |
| Firebase | Projet `resas-d1707` partagé avec iOS | `google-services.json` copié depuis legacy (même `package_name`, même `project_id`). |
| Push notifications | FCM via Firebase Messaging BOM | Plugin `@capacitor/push-notifications@8` déjà installé pour iOS, auto-câble Android via `cap sync`. Hook front `src/services/pushNotifications.js` déjà multi-plateforme. |
| Workflow build | 100% manuel (Android Studio + upload Play Console) | Le user veut contrôler chaque publication, pas de CI/CD. |
| Première release | Track **Internal testing** → promotion manuelle Production | Validation sur le téléphone Android du user avant rollout public. |

## Architecture

App Capacitor 8 Android wrappant le bundle React de `build/`, strictement parallèle à iOS :

```
1755-front/
├── android/                     # nouveau, versionné (sauf exclusions)
│   ├── app/
│   │   ├── build.gradle         # versions, signing, Firebase
│   │   ├── google-services.json # gitignoré
│   │   └── src/main/
│   │       ├── AndroidManifest.xml
│   │       └── assets/public/   # bundle React copié par cap sync
│   ├── build.gradle             # classpath google-services
│   ├── keystore.properties      # gitignoré
│   └── settings.gradle
├── ios/                         # déjà en place
├── capacitor.config.json        # déjà en place, partagé iOS/Android
└── build/                       # bundle React, source du sync Capacitor
```

**Exclusions `.gitignore`** :
- `android/build/`
- `android/.gradle/`
- `android/app/build/`
- `android/local.properties`
- `android/keystore.properties`
- `android/app/google-services.json`
- `*.keystore`, `*.jks`

## Firebase & push notifications

Reprise intégrale de la config iOS Firebase :
- Projet : `resas-d1707`
- `package_name` Android dans `google-services.json` : `com.baravin1755` (déjà ainsi dans le fichier legacy)
- Aucune action côté Firebase Console : FCM est natif Firebase, pas besoin d'upload de clé comme APNs sur iOS.

**Câblage Gradle** :
- Root `android/build.gradle` : ajouter `classpath 'com.google.gms:google-services:<version>'` dans `buildscript.dependencies`.
- `android/app/build.gradle` : ajouter au bottom `apply plugin: 'com.google.gms.google-services'` (conditionnel sur présence de `google-services.json`, comme dans le legacy).
- Dépendances : `implementation platform('com.google.firebase:firebase-bom:<version>')` + `implementation 'com.google.firebase:firebase-messaging'`.

**Permission Android 13+** : `POST_NOTIFICATIONS` ajoutée automatiquement par `@capacitor/push-notifications` lors du `cap sync`. Le hook `pushNotifications.js` doit déjà gérer la demande de permission au runtime (validé sur iOS).

**Validation push** : depuis Firebase Console → Cloud Messaging → "Send test message" avec le token FCM récupéré au runtime via le hook.

## Signing release

**Keystore d'upload** : `D:\Telechargements\keystore-export.jks` à relocaliser vers `C:\Users\Utilisateur\.android-keystores\baravin1755-upload.jks` (emplacement stable hors `Telechargements`, hors projet, hors cloud sync).

**Credentials** : stockées dans Android Studio Password Safe (`C:\Users\Utilisateur\AppData\Roaming\Google\AndroidStudio2023.2\c.kdbx`). À extraire la première fois pour remplir `keystore.properties`.

**`android/keystore.properties`** (gitignoré) :
```properties
storeFile=C:/Users/Utilisateur/.android-keystores/baravin1755-upload.jks
storePassword=<récupéré depuis Password Safe>
keyAlias=<récupéré depuis Password Safe>
keyPassword=<récupéré depuis Password Safe>
```

**`android/app/build.gradle` — bloc signing** :
```gradle
def keystorePropertiesFile = rootProject.file("keystore.properties")
def keystoreProperties = new Properties()
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}

android {
    signingConfigs {
        release {
            if (keystorePropertiesFile.exists()) {
                storeFile file(keystoreProperties['storeFile'])
                storePassword keystoreProperties['storePassword']
                keyAlias keystoreProperties['keyAlias']
                keyPassword keystoreProperties['keyPassword']
            }
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
```

**Play App Signing** : déjà actif côté Google sur le listing legacy. Le `keystore-export.jks` est la clé d'**upload** (Google détient la clé de **release** côté serveur). En cas de perte de la clé d'upload : `Play Console → App integrity → Request upload key reset` (1–2 jours ouvrés).

## Workflow build & déploiement

**À chaque release** :
1. Sur n'importe quelle machine : `npm run build` + commit + push `main`.
2. Sur Windows : `git pull origin main`.
3. Bumper `versionCode` (+1) et `versionName` dans `android/app/build.gradle`.
4. `npx cap sync android`.
5. Android Studio → `Build > Generate Signed Bundle / APK` → Android App Bundle (AAB) → release. Studio remplit le keystore via Password Safe.
6. Output : `android/app/release/app-release.aab`.
7. Play Console → app `Baravin 1755` → **Internal testing** (ou Production selon décision) → Create new release → upload AAB → Save → Review → Start rollout.

**Aucune publication automatique** : chaque étape est manuelle dans Play Console. Le rollout progressif est disponible si le user le souhaite (5% → 100% avec pauses).

**Première release v2.1.0** : track Internal testing → installation sur le téléphone Android du user via le lien Play Store du track → validation manuelle (carte, réservation, push, safe areas) → promotion vers Production en un clic.

## Séquence d'implémentation

Découpage en phases avec un commit par phase, sur la branche `feat/android-capacitor`.

### Phase 1 — Scaffold

- Vérifier `node --version` ≥ 22 (Capacitor 8 CLI le requiert). Sur le PC Windows : Node v24 installé nativement, pas de manager de versions, rien à activer.
- `npm install @capacitor/android@8`
- `npx cap add android`
- Premier `npx cap sync android`
- Commit : `feat(android): scaffold Capacitor 8`

### Phase 2 — Config app

- Ajuster `android/app/build.gradle` : `applicationId`, `versionCode 31`, `versionName "2.1.0"`, `compileSdk 35`, `targetSdk 35`, `minSdk 23`.
- Mettre à jour `.gitignore` (keystore, `google-services.json`, build artifacts).
- Commit : `feat(android): config build & SDK levels`

### Phase 3 — Firebase / Push

- Copier `D:\03_Projets\1755-resas\android\app\google-services.json` → `android/app/google-services.json`.
- Ajouter classpath `com.google.gms:google-services` dans root `android/build.gradle`.
- Ajouter `apply plugin: 'com.google.gms.google-services'` conditionnel + dépendances Firebase BOM + `firebase-messaging` dans `android/app/build.gradle`.
- `npx cap sync android` pour câbler `@capacitor/push-notifications`.
- Commit : `feat(android): Firebase Messaging + push notifications`

### Phase 4 — Signing

- Relocaliser keystore : `D:\Telechargements\keystore-export.jks` → `C:\Users\Utilisateur\.android-keystores\baravin1755-upload.jks`.
- Créer `android/keystore.properties` avec credentials extraites du Password Safe.
- Câbler `signingConfigs.release` dans `android/app/build.gradle`.
- Commit : `feat(android): release signing config`

### Phase 5 — Build & test

- `npm run build && npx cap sync android`.
- Android Studio → Generate Signed Bundle → AAB release.
- Upload sur **Internal testing** Play Console (sans toucher au track Production).
- Installer sur le téléphone Android du user via lien Play Store du track Internal testing.
- Valider : navigation carte, réserver, push (Firebase Console "Send test message"), safe areas, footer compact, hero, BottomAppBar.

### Phase 6 — Production

- Promouvoir le track Internal testing → Production dans Play Console (action manuelle, quand le user décide).
- Mettre à jour `CLAUDE.md` section Android avec workflow définitif et chemins de référence.
- Merge `feat/android-capacitor` → `main` sur feu vert explicite du user (conformément à la règle "pas de merge sur main sans validation" du CLAUDE.md).

## Risques & mitigations

| Risque | Mitigation |
|---|---|
| Perte des credentials keystore | Stockés dans Android Studio Password Safe + Play App Signing (récupération possible côté Google sous 1–2 jours). |
| Régression UX legacy → unifié | Track Internal testing valide sur device réel avant Production. |
| `versionCode` collision | Lecture du Play Console avant chaque bump. Démarrage à 31 (legacy = 30). |
| Push notifications iOS marche, Android non | Tester explicitement avec "Send test message" Firebase Console en Phase 5 avant promotion Production. |
| Divergence `versionName` iOS (2.0.0) / Android (2.1.0) | Documentée. Inévitable car Android ne peut pas downgrader. iOS rattrapera mécaniquement aux releases suivantes. |
| `google-services.json` exposé dans git | Gitignoré. Source de vérité = Firebase Console (`firebase_get_sdk_config`) ou copie locale legacy. |

## Documentation à mettre à jour

À la fin de Phase 6 :
- `CLAUDE.md` section "Android (à faire depuis PC Windows)" → "Android (Capacitor)" avec workflow définitif, chemins keystore, référence Password Safe, version courante.
- Ajouter référence à ce spec dans la section "Documentation projet" du CLAUDE.md.
