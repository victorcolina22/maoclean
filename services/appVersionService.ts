import * as Application from "expo-application";
import { doc, getDoc } from "firebase/firestore";
import { db } from "./firebase";

// EAS's "appVersionSource": "remote" (see eas.json) auto-increments the
// native build number on every build — no manual version bump needed here,
// just compare the installed build against whatever minimum is published.
interface AppVersionConfig {
  minBuildNumber: number;
  latestApkUrl?: string;
}

export interface VersionCheckResult {
  isSupported: boolean;
  latestApkUrl?: string;
}

export async function checkAppVersion(): Promise<VersionCheckResult> {
  try {
    const snap = await getDoc(doc(db, "config", "appVersion"));
    if (!snap.exists()) return { isSupported: true };

    const config = snap.data() as AppVersionConfig;
    const installedBuild = Number(Application.nativeBuildVersion);

    if (!Number.isFinite(installedBuild) || !Number.isFinite(config.minBuildNumber)) {
      return { isSupported: true };
    }

    return {
      isSupported: installedBuild >= config.minBuildNumber,
      latestApkUrl: config.latestApkUrl,
    };
  } catch (e) {
    // Fail OPEN: a network hiccup on launch shouldn't lock everyone out —
    // only block when we've actually confirmed the installed build is old.
    console.error("[appVersionService] version check failed, allowing access:", e);
    return { isSupported: true };
  }
}
