# Profile Feature Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate the Profile feature (`/api/profile`, `/api/profile/password`, and the `Profile` page component) to the repository/service/route architecture and component-decomposition conventions from `CLAUDE.md`.

**Architecture:** Extract the one direct Prisma call in `src/app/api/profile/route.ts` into a new `repository.ts`; move all business logic (Firebase Auth updates, password verification, orchestration) into `services.ts`, which throws typed errors from `lib/errors.ts`; add Zod schemas for both routes' request bodies; route handlers become thin wrappers using `handleApiError()`. The 601-line `Profile` page component is split into three presentational components plus one extracted hook, orchestrated by a slimmed-down `index.tsx`.

**Tech Stack:** Next.js 15 App Router, Prisma, Firebase Admin SDK, Zod, Vitest, React Hook Form.

**Spec:** `docs/superpowers/specs/2026-09-22-code-cleanup-design.md`

**Depends on:** `docs/superpowers/plans/2026-09-22-code-cleanup-foundation.md` must be merged first — this plan uses `lib/errors.ts` (`ValidationError`, `NotFoundError`, `UnauthorizedError`) and `lib/handle-api-error.ts` from that plan, and assumes Vitest is already configured.

## Global Constraints

- No AI/Claude Code attribution in commit messages or PR descriptions.
- Do not touch `/api/v1/gateway`, admin-password auth, or guest-code validation — out of scope.
- One branch/PR (`refactor/profile-service-repo`), based on `dev`, left fully working at the end.
- `syncUserToDatabaseService` (`src/app/api/sync/syncService.ts`) is shared infrastructure used by 13 files across the codebase (groups, trips, expenses, notifications, profile, ...) — it is **not** part of Profile's scope. Call it as-is; do not modify it here.
- No behavior change beyond: (a) routes now reject malformed bodies with a 400 before touching any service/DB, (b) unexpected/unknown errors return a generic "Internal server error" message instead of leaking `error.message` to the client. Both are intentional per the spec and called out in the PR description — nothing else about how the feature behaves should change.

---

### Task 1: Repository, services, schemas, and route handlers

**Files:**
- Create: `src/app/api/profile/repository.ts`
- Create: `src/app/api/profile/schemas.ts`
- Create: `src/app/api/profile/services.ts`
- Create: `src/app/api/profile/services.test.ts`
- Modify: `src/app/api/profile/route.ts`
- Modify: `src/app/api/profile/password/route.ts`

**Interfaces:**
- Consumes: `AppError`, `NotFoundError`, `UnauthorizedError`, `ValidationError` from `@/lib/errors`; `handleApiError` from `@/lib/handle-api-error` (both from the Foundation plan). `syncUserToDatabaseService(token: DecodedIdToken, forceSync?: boolean)` from `../sync/syncService` (unchanged, external).
- Produces: `updateUserMetadataByFirebaseId(firebaseId: string, data: { bio?: string; travelStyle?: string }): Promise<User>` from `repository.ts`. `getProfileService(decodedToken)`, `updateProfileService(decodedToken, input: UpdateProfileInput)`, `updatePasswordService(decodedToken, input: UpdatePasswordInput)` from `services.ts`. `updateProfileSchema`, `updatePasswordSchema` from `schemas.ts`.

- [ ] **Step 1: Create the repository**

Create `src/app/api/profile/repository.ts`:

```ts
import prisma from "@/lib/prisma";

export interface ProfileMetadataUpdate {
  bio?: string;
  travelStyle?: string;
}

export function updateUserMetadataByFirebaseId(
  firebaseId: string,
  data: ProfileMetadataUpdate,
) {
  return prisma.user.update({
    where: { firebaseId },
    data,
  });
}
```

(No test file for this one — per the spec's testing strategy, thin Prisma passthroughs aren't unit tested in Pass 1.)

- [ ] **Step 2: Create the Zod schemas**

Create `src/app/api/profile/schemas.ts`:

```ts
import { z } from "zod";

export const updateProfileSchema = z
  .object({
    name: z.string().min(1).optional(),
    photoURL: z.string().url().optional(),
    bio: z.string().max(500).optional(),
    travelStyle: z.string().max(50).optional(),
  })
  .refine(
    (data) =>
      data.name !== undefined ||
      data.photoURL !== undefined ||
      data.bio !== undefined ||
      data.travelStyle !== undefined,
    {
      message:
        "At least one field (name, photoURL, bio, or travelStyle) must be provided",
    },
  );

export type UpdateProfileBody = z.infer<typeof updateProfileSchema>;

export const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
});

export type UpdatePasswordBody = z.infer<typeof updatePasswordSchema>;
```

- [ ] **Step 3: Write the failing tests for the services**

Create `src/app/api/profile/services.test.ts`:

```ts
import type { DecodedIdToken } from "firebase-admin/auth";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NotFoundError, UnauthorizedError, ValidationError } from "@/lib/errors";

const mockUpdateUser = vi.fn();
const mockGetUser = vi.fn();

vi.mock("@/lib/firebase-admin", () => ({
  userAuth: {
    updateUser: (...args: unknown[]) => mockUpdateUser(...args),
    getUser: (...args: unknown[]) => mockGetUser(...args),
  },
}));

const mockSyncUserToDatabaseService = vi.fn();
vi.mock("../sync/syncService", () => ({
  syncUserToDatabaseService: (...args: unknown[]) =>
    mockSyncUserToDatabaseService(...args),
}));

const mockUpdateUserMetadataByFirebaseId = vi.fn();
vi.mock("./repository", () => ({
  updateUserMetadataByFirebaseId: (...args: unknown[]) =>
    mockUpdateUserMetadataByFirebaseId(...args),
}));

const { getProfileService, updatePasswordService, updateProfileService } =
  await import("./services");

const decodedToken = {
  uid: "user-1",
  email: "user@example.com",
} as DecodedIdToken;

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("NEXT_PUBLIC_FIREBASE_API_KEY", "test-key");
  vi.stubGlobal("fetch", vi.fn());
});

describe("getProfileService", () => {
  it("syncs without forcing", async () => {
    mockSyncUserToDatabaseService.mockResolvedValue({ id: "user-1" });

    const result = await getProfileService(decodedToken);

    expect(mockSyncUserToDatabaseService).toHaveBeenCalledWith(decodedToken, false);
    expect(result).toEqual({ id: "user-1" });
  });
});

describe("updateProfileService", () => {
  it("updates Firebase Auth fields when name/photoURL are provided", async () => {
    mockSyncUserToDatabaseService.mockResolvedValue({ id: "user-1", name: "New Name" });

    await updateProfileService(decodedToken, { name: "New Name" });

    expect(mockUpdateUser).toHaveBeenCalledWith("user-1", { displayName: "New Name" });
    expect(mockUpdateUserMetadataByFirebaseId).not.toHaveBeenCalled();
    expect(mockSyncUserToDatabaseService).toHaveBeenCalledWith(decodedToken, true);
  });

  it("updates Prisma metadata when bio/travelStyle are provided", async () => {
    mockSyncUserToDatabaseService.mockResolvedValue({ id: "user-1" });

    await updateProfileService(decodedToken, { bio: "Hello", travelStyle: "Adventure" });

    expect(mockUpdateUser).not.toHaveBeenCalled();
    expect(mockUpdateUserMetadataByFirebaseId).toHaveBeenCalledWith("user-1", {
      bio: "Hello",
      travelStyle: "Adventure",
    });
  });

  it("updates both Firebase and Prisma fields when both are provided", async () => {
    mockSyncUserToDatabaseService.mockResolvedValue({ id: "user-1" });

    await updateProfileService(decodedToken, { name: "New Name", bio: "Hello" });

    expect(mockUpdateUser).toHaveBeenCalledWith("user-1", { displayName: "New Name" });
    expect(mockUpdateUserMetadataByFirebaseId).toHaveBeenCalledWith("user-1", {
      bio: "Hello",
    });
  });
});

describe("updatePasswordService", () => {
  it("throws ValidationError when the token has no email", async () => {
    await expect(
      updatePasswordService({ uid: "user-1" } as DecodedIdToken, {
        currentPassword: "x",
        newPassword: "newpassword123",
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("throws UnauthorizedError when the current password is wrong", async () => {
    (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      json: async () => ({ error: { message: "INVALID_PASSWORD" } }),
    });

    await expect(
      updatePasswordService(decodedToken, {
        currentPassword: "wrong",
        newPassword: "newpassword123",
      }),
    ).rejects.toThrow(UnauthorizedError);

    expect(mockUpdateUser).not.toHaveBeenCalled();
  });

  it("throws NotFoundError when the Firebase user can't be found after verification", async () => {
    (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });
    mockGetUser.mockResolvedValue(null);

    await expect(
      updatePasswordService(decodedToken, {
        currentPassword: "correct",
        newPassword: "newpassword123",
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("updates the password when verification succeeds", async () => {
    (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });
    mockGetUser.mockResolvedValue({ uid: "user-1" });

    await updatePasswordService(decodedToken, {
      currentPassword: "correct",
      newPassword: "newpassword123",
    });

    expect(mockUpdateUser).toHaveBeenCalledWith("user-1", { password: "newpassword123" });
  });
});
```

- [ ] **Step 4: Run the tests to verify they fail**

Run: `npm run test -- src/app/api/profile/services.test.ts`
Expected: FAIL with "Cannot find module './services'" (the file doesn't exist yet).

- [ ] **Step 5: Implement the services**

Create `src/app/api/profile/services.ts`:

```ts
import type { DecodedIdToken } from "firebase-admin/auth";
import { userAuth } from "@/lib/firebase-admin";
import { NotFoundError, UnauthorizedError, ValidationError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { syncUserToDatabaseService } from "../sync/syncService";
import { updateUserMetadataByFirebaseId } from "./repository";
import type { UpdatePasswordBody, UpdateProfileBody } from "./schemas";

export type UpdateProfileInput = UpdateProfileBody;
export type UpdatePasswordInput = UpdatePasswordBody;

export async function getProfileService(decodedToken: DecodedIdToken) {
  return syncUserToDatabaseService(decodedToken, false);
}

export async function updateProfileService(
  decodedToken: DecodedIdToken,
  input: UpdateProfileInput,
) {
  const { name, photoURL, bio, travelStyle } = input;

  if (!userAuth) {
    throw new Error("Firebase admin not initialized");
  }

  const uid = decodedToken.uid;

  if (name !== undefined || photoURL !== undefined) {
    const firebaseUpdate: { displayName?: string; photoURL?: string } = {};
    if (name !== undefined) firebaseUpdate.displayName = name;
    if (photoURL !== undefined) firebaseUpdate.photoURL = photoURL;

    await userAuth.updateUser(uid, firebaseUpdate);
    logger.info("Firebase Auth profile updated", {
      uid,
      updates: Object.keys(firebaseUpdate),
    });
  }

  if (bio !== undefined || travelStyle !== undefined) {
    await updateUserMetadataByFirebaseId(uid, {
      ...(bio !== undefined && { bio }),
      ...(travelStyle !== undefined && { travelStyle }),
    });
    logger.info("Prisma profile metadata updated", {
      uid,
      hasBio: bio !== undefined,
      hasTravelStyle: travelStyle !== undefined,
    });
  }

  return syncUserToDatabaseService(decodedToken, true);
}

export async function updatePasswordService(
  decodedToken: DecodedIdToken,
  input: UpdatePasswordInput,
) {
  const { currentPassword, newPassword } = input;
  const uid = decodedToken.uid;
  const email = decodedToken.email;

  if (!email) {
    throw new ValidationError("User email not found");
  }

  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!apiKey) {
    logger.error("Firebase API Key missing in environment");
    throw new Error("Configuration missing");
  }

  const verifyResponse = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password: currentPassword,
        returnSecureToken: true,
      }),
    },
  );

  if (!verifyResponse.ok) {
    const errorData = await verifyResponse.json().catch(() => ({}));
    const firebaseError = errorData?.error?.message;

    if (
      firebaseError === "INVALID_PASSWORD" ||
      firebaseError === "INVALID_LOGIN_CREDENTIALS"
    ) {
      throw new UnauthorizedError("Incorrect current password");
    }

    logger.error("Firebase verification failed", errorData);
    throw new UnauthorizedError("Failed to verify current password");
  }

  if (!userAuth) {
    throw new Error("Firebase Admin not initialized");
  }

  const firebaseUser = await userAuth.getUser(uid);
  if (!firebaseUser) {
    throw new NotFoundError("User not found");
  }

  await userAuth.updateUser(uid, { password: newPassword });
  logger.info("Password updated successfully", { uid });
}
```

- [ ] **Step 6: Run the tests to verify they pass**

Run: `npm run test -- src/app/api/profile/services.test.ts`
Expected: PASS — 8 tests passed.

- [ ] **Step 7: Rewrite the route handlers to be thin**

Replace the full contents of `src/app/api/profile/route.ts`:

```ts
import { withAuth, type AuthContext } from "@/lib/auth/with-auth";
import { handleApiError } from "@/lib/handle-api-error";
import { NextRequest, NextResponse } from "next/server";
import { updateProfileSchema } from "./schemas";
import { getProfileService, updateProfileService } from "./services";

async function getHandler(_req: NextRequest, context: AuthContext) {
  try {
    const user = await getProfileService(context.decodedToken);
    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}

async function patchHandler(req: NextRequest, context: AuthContext) {
  try {
    const body = updateProfileSchema.parse(await req.json());
    const user = await updateProfileService(context.decodedToken, body);
    return NextResponse.json(
      { message: "Profile updated successfully", user },
      { status: 200 },
    );
  } catch (error) {
    return handleApiError(error);
  }
}

export const GET = withAuth(getHandler);
export const PATCH = withAuth(patchHandler);
```

Replace the full contents of `src/app/api/profile/password/route.ts`:

```ts
import { withAuth, type AuthContext } from "@/lib/auth/with-auth";
import { handleApiError } from "@/lib/handle-api-error";
import { NextRequest, NextResponse } from "next/server";
import { updatePasswordSchema } from "../schemas";
import { updatePasswordService } from "../services";

async function patchHandler(req: NextRequest, context: AuthContext) {
  try {
    const body = updatePasswordSchema.parse(await req.json());
    await updatePasswordService(context.decodedToken, body);
    return NextResponse.json(
      { message: "Password updated successfully" },
      { status: 200 },
    );
  } catch (error) {
    return handleApiError(error);
  }
}

export const PATCH = withAuth(patchHandler);
```

- [ ] **Step 8: Run the full test suite and typecheck**

Run: `npm run test && npx tsc --noEmit`
Expected: all tests pass; no type errors.

- [ ] **Step 9: Commit**

```bash
git add src/app/api/profile
git commit -m "refactor: split profile API into repository/service/route layers with Zod validation"
```

---

### Task 2: Component decomposition

**Files:**
- Create: `src/hooks/useProfileImageUpload.ts`
- Create: `src/app/components/pages/Profile/components/ProfileHeader.tsx`
- Create: `src/app/components/pages/Profile/components/ProfileEditForm.tsx`
- Create: `src/app/components/pages/Profile/components/ProfileStats.tsx`
- Modify: `src/app/components/pages/Profile/index.tsx`

**Interfaces:**
- Produces: `useProfileImageUpload(): { fileInputRef, photoPreview, setPhotoPreview, uploadedPhotoURL, uploadingImage, uploadError, handleImageUpload, resetUpload }`. `ProfileHeader`, `ProfileEditForm`, `ProfileStats` as documented by their prop interfaces below — consumed only by `Profile/index.tsx`.

- [ ] **Step 1: Extract the image-upload hook**

Create `src/hooks/useProfileImageUpload.ts`:

```ts
"use client";
import { useCallback, useRef, useState } from "react";
import api from "@/lib/axios";
import { logger } from "@/lib/logger";

export function useProfileImageUpload() {
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploadedPhotoURL, setUploadedPhotoURL] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!file.type.startsWith("image/")) {
        setUploadError("File must be an image");
        return;
      }

      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        setUploadError("File size must be less than 5MB");
        return;
      }

      setUploadingImage(true);
      setUploadError(null);

      try {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPhotoPreview(reader.result as string);
        };
        reader.readAsDataURL(file);

        const formData = new FormData();
        formData.append("file", file);
        formData.append("folder", "users/avatars");

        const response = await api.post<{ url: string; publicId: string }>(
          "/upload/image",
          formData,
          { headers: { "Content-Type": "multipart/form-data" } },
        );

        setUploadedPhotoURL(response.data.url);
      } catch (error: unknown) {
        logger.error("Failed to upload image", error);
        setUploadError("Failed to upload image. Please try again.");
      } finally {
        setUploadingImage(false);
      }
    },
    [],
  );

  const resetUpload = useCallback((initialPreview: string | null) => {
    setPhotoPreview(initialPreview);
    setUploadedPhotoURL(null);
    setUploadError(null);
  }, []);

  return {
    fileInputRef,
    photoPreview,
    setPhotoPreview,
    uploadedPhotoURL,
    uploadingImage,
    uploadError,
    handleImageUpload,
    resetUpload,
  };
}
```

- [ ] **Step 2: Create the header/avatar component**

Create `src/app/components/pages/Profile/components/ProfileHeader.tsx`:

```tsx
import { Calendar, Camera, Edit, Loader2, LogOut, Mail, MapPin, User } from "lucide-react";
import Image from "next/image";
import type { RefObject } from "react";

interface ProfileHeaderProps {
  displayName: string;
  email: string;
  memberSince: Date;
  avatarUrl: string | null;
  travelStyle?: string;
  bio?: string;
  isEditMode: boolean;
  uploadingImage: boolean;
  fileInputRef: RefObject<HTMLInputElement>;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAvatarButtonClick: () => void;
  onEditClick: () => void;
  onLogout: () => void;
}

export function ProfileHeader({
  displayName,
  email,
  memberSince,
  avatarUrl,
  travelStyle,
  bio,
  isEditMode,
  uploadingImage,
  fileInputRef,
  onFileChange,
  onAvatarButtonClick,
  onEditClick,
  onLogout,
}: ProfileHeaderProps) {
  return (
    <>
      <div className='bg-slate-900/60 border border-white/10 rounded-3xl p-6 sm:p-8 mb-8'>
        <div className='flex flex-col md:flex-row items-center md:items-start gap-6'>
          <div className='relative group'>
            <div className='relative w-28 h-28 sm:w-32 sm:h-32 rounded-full border border-white/15 bg-slate-900 overflow-hidden'>
              {avatarUrl ? (
                <Image src={avatarUrl} alt={displayName} fill className='object-cover' />
              ) : (
                <div className='w-full h-full flex items-center justify-center text-slate-600'>
                  <User className='w-12 h-12' />
                </div>
              )}
            </div>

            <input
              type='file'
              ref={fileInputRef}
              onChange={onFileChange}
              className='hidden'
              accept='image/*'
            />
            <button
              onClick={onAvatarButtonClick}
              disabled={uploadingImage}
              className={`absolute -bottom-1 -right-1 w-9 h-9 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-full flex items-center justify-center border border-white/15 transition-all ${
                isEditMode ? "opacity-100" : "opacity-0 group-hover:opacity-100"
              } ${uploadingImage ? "cursor-not-allowed opacity-100" : ""}`}
              type='button'
              title={isEditMode ? "Change Photo" : "Edit Profile"}
            >
              {uploadingImage ? (
                <Loader2 className='w-4 h-4 animate-spin' />
              ) : (
                <Camera className='w-4 h-4' />
              )}
            </button>
          </div>

          <div className='flex-1 text-center md:text-left space-y-3'>
            <div>
              <h1 className='text-3xl sm:text-4xl font-semibold text-white mb-2'>
                {displayName}
              </h1>
              <div className='flex flex-wrap items-center justify-center md:justify-start gap-4 text-slate-400 text-sm'>
                <div className='flex items-center gap-2'>
                  <Mail className='w-4 h-4' />
                  <span>{email}</span>
                </div>
                <div className='flex items-center gap-2'>
                  <Calendar className='w-4 h-4' />
                  <span>Member since {memberSince.getFullYear()}</span>
                </div>
              </div>
            </div>

            {travelStyle && (
              <div className='inline-flex items-center gap-2 px-3 py-1.5 bg-slate-800 border border-white/10 rounded-full text-xs font-medium text-slate-300'>
                <MapPin className='w-3 h-3' />
                {travelStyle}
              </div>
            )}

            <p className='text-slate-300 leading-relaxed max-w-xl mx-auto md:mx-0 text-sm'>
              {bio || "No bio yet. Tell us where you're headed next."}
            </p>
          </div>
        </div>
      </div>

      {!isEditMode && (
        <div className='flex flex-wrap items-center justify-center md:justify-start gap-3 mb-8'>
          <button
            onClick={onEditClick}
            className='px-5 py-2.5 bg-white text-slate-950 hover:bg-slate-200 font-medium text-sm rounded-xl transition-all flex items-center gap-2'
          >
            <Edit className='w-4 h-4' />
            Edit Profile
          </button>
          <button
            onClick={onLogout}
            className='px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm rounded-xl border border-white/10 transition-all flex items-center gap-2'
          >
            <LogOut className='w-4 h-4' />
            Sign Out
          </button>
        </div>
      )}
    </>
  );
}
```

- [ ] **Step 3: Create the edit-form component**

Create `src/app/components/pages/Profile/components/ProfileEditForm.tsx`:

```tsx
"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Lock } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";
import type { TEditProfileSchema } from "../../../shared/Modal/EditProfileModal/editProfileZod";

interface ProfileEditFormProps {
  form: UseFormReturn<TEditProfileSchema>;
  onSubmit: (values: TEditProfileSchema) => void;
  onCancel: () => void;
  isSubmitting: boolean;
  showPasswordSection: boolean;
  onTogglePasswordSection: () => void;
}

export function ProfileEditForm({
  form,
  onSubmit,
  onCancel,
  isSubmitting,
  showPasswordSection,
  onTogglePasswordSection,
}: ProfileEditFormProps) {
  return (
    <div className='bg-slate-900/60 rounded-3xl border border-white/10 p-6 sm:p-10 mb-10'>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-8'>
        <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-white/10'>
          <h2 className='text-xl font-semibold text-white'>Edit Profile</h2>
          <div className='flex gap-3 w-full sm:w-auto'>
            <Button
              type='button'
              onClick={onCancel}
              variant='outline'
              className='flex-1 sm:flex-none bg-slate-800 border-white/10 text-sm rounded-xl px-5'
            >
              Cancel
            </Button>
            <Button
              type='submit'
              disabled={isSubmitting}
              className='flex-1 sm:flex-none bg-white text-slate-950 hover:bg-slate-200 text-sm rounded-xl px-5'
            >
              {isSubmitting && <Loader2 className='w-3 h-3 animate-spin mr-2' />}
              Save Identity
            </Button>
          </div>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
          <div className='space-y-6'>
            <div className='space-y-2'>
              <Label className='text-xs font-medium text-slate-400 ml-1'>Name</Label>
              <Input
                {...form.register("name")}
                className='bg-slate-800 border-white/10 h-12 rounded-xl text-sm'
              />
            </div>
            <div className='space-y-2'>
              <Label className='text-xs font-medium text-slate-400 ml-1'>Bio</Label>
              <textarea
                {...form.register("bio")}
                className='w-full min-h-[150px] bg-slate-800 border border-white/10 rounded-xl p-4 text-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-500 placeholder:text-slate-500 transition-all text-sm resize-none'
                placeholder='A short intro about your travel style...'
              />
            </div>
          </div>

          <div className='space-y-6'>
            <div className='space-y-2'>
              <Label className='text-xs font-medium text-slate-400 ml-1'>Travel Style</Label>
              <Input
                {...form.register("travelStyle")}
                placeholder='e.g. Adventure, Relaxed, Budget'
                className='bg-slate-800 border-white/10 h-12 rounded-xl text-sm'
              />
            </div>

            <div className='pt-4'>
              <button
                type='button'
                onClick={onTogglePasswordSection}
                className='flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-white transition-colors'
              >
                <Lock className='w-3 h-3' />
                {showPasswordSection ? "Keep current credentials" : "Update security credentials"}
              </button>

              {showPasswordSection && (
                <div className='mt-4 grid grid-cols-1 gap-4 p-4 bg-slate-950 rounded-xl border border-white/10'>
                  <Input
                    type='password'
                    {...form.register("currentPassword")}
                    className='bg-slate-800 border-white/10 h-11 rounded-xl'
                    placeholder='Current Password'
                  />
                  <div className='grid grid-cols-2 gap-4'>
                    <Input
                      type='password'
                      {...form.register("newPassword")}
                      className='bg-slate-800 border-white/10 h-11 rounded-xl'
                      placeholder='New Password'
                    />
                    <Input
                      type='password'
                      {...form.register("confirmPassword")}
                      className='bg-slate-800 border-white/10 h-11 rounded-xl'
                      placeholder='Confirm New'
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
```

- [ ] **Step 4: Create the stats/journeys component**

Create `src/app/components/pages/Profile/components/ProfileStats.tsx`:

```tsx
"use client";
import { Calendar, Globe, MapPin, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import type { Group } from "@/src/shared/types";

interface ProfileStatsProps {
  groups: Group[];
}

export function ProfileStats({ groups }: ProfileStatsProps) {
  const router = useRouter();

  const totalGroups = groups.length;
  const totalTrips = groups.reduce((acc, g) => acc + (g.trips?.length || 0), 0);
  const totalActivities = groups.reduce(
    (acc, g) =>
      acc +
      (g.trips?.reduce((tAcc, t) => tAcc + (t.activities?.length || 0), 0) || 0),
    0,
  );
  const uniqueLocations = Array.from(
    new Set(groups.flatMap((g) => g.trips?.map((t) => t.location).filter(Boolean) || [])),
  ).length;

  const stats = [
    { label: "Groups", value: totalGroups, icon: Users },
    { label: "Destinations", value: uniqueLocations, icon: Globe },
    { label: "Activities", value: totalActivities, icon: Calendar },
    { label: "Trips", value: totalTrips, icon: MapPin },
  ];

  return (
    <div className='space-y-10'>
      <div className='grid grid-cols-2 md:grid-cols-4 gap-3'>
        {stats.map((stat) => (
          <div key={stat.label} className='bg-slate-900/60 border border-white/10 rounded-2xl p-4'>
            <div className='flex items-center justify-between mb-3'>
              <p className='text-xs text-slate-400'>{stat.label}</p>
              <stat.icon className='w-4 h-4 text-slate-500' />
            </div>
            <p className='text-2xl sm:text-3xl font-semibold text-white'>{stat.value}</p>
          </div>
        ))}
      </div>

      {groups.length > 0 && (
        <div className='space-y-4'>
          <div className='flex items-center justify-between'>
            <h3 className='text-base font-semibold text-white'>Recent Journeys</h3>
            <button
              onClick={() => router.push("/groups")}
              className='text-sm text-slate-400 hover:text-white transition-colors'
            >
              View All
            </button>
          </div>
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
            {groups.slice(0, 4).map((group) => (
              <div
                key={group.id}
                onClick={() => router.push(`/group/${group.id}`)}
                className='p-4 bg-slate-900/60 hover:bg-slate-800/80 border border-white/10 rounded-2xl transition-colors cursor-pointer'
              >
                <div className='flex items-center gap-4'>
                  <div className='w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-2xl'>
                    {group.emoji || "✈️"}
                  </div>
                  <div className='flex-1'>
                    <h4 className='font-semibold text-white text-sm mb-1'>{group.name}</h4>
                    <div className='flex items-center gap-3'>
                      <p className='text-xs text-slate-400'>{group.trips?.length || 0} trips</p>
                      <div className='w-1 h-1 rounded-full bg-slate-600' />
                      <p className='text-xs text-slate-400'>
                        {group.memberEmails?.length || 0} members
                      </p>
                    </div>
                  </div>
                  <span className='text-xs text-slate-500'>Open</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 5: Slim down `index.tsx` to orchestrate the three components**

Replace the full contents of `src/app/components/pages/Profile/index.tsx`:

```tsx
"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { signOut } from "firebase/auth";
import { Edit, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/firebase";
import { useCurrentUser } from "@/src/hooks/useCurrentUser";
import { useGroups } from "@/src/hooks/useGroups";
import { useProfileImageUpload } from "@/src/hooks/useProfileImageUpload";
import {
  useCurrentUserDB,
  useUpdatePassword,
  useUpdateProfile,
} from "@/src/hooks/useProfile";
import {
  editProfileSchema,
  TEditProfileSchema,
} from "../../shared/Modal/EditProfileModal/editProfileZod";
import PremiumPageHeader from "../../shared/PremiumPageHeader";
import LoadingState from "../../shared/LoadingState";
import DashboardBottomNav from "../Dashboard/DashboardBottomNav";
import { ProfileEditForm } from "./components/ProfileEditForm";
import { ProfileHeader } from "./components/ProfileHeader";
import { ProfileStats } from "./components/ProfileStats";

const ProfileComponent = () => {
  const router = useRouter();
  const { user: firebaseUser, loading: firebaseLoading } = useCurrentUser();
  const { data: userDB, isLoading: dbLoading } = useCurrentUserDB();
  const { data: groupsData } = useGroups();
  const groups = groupsData?.groups || [];

  const [isEditMode, setIsEditMode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPasswordSection, setShowPasswordSection] = useState(false);

  const updateProfileMutation = useUpdateProfile();
  const updatePasswordMutation = useUpdatePassword();
  const {
    fileInputRef,
    photoPreview,
    uploadedPhotoURL,
    uploadingImage,
    uploadError,
    handleImageUpload,
    resetUpload,
  } = useProfileImageUpload();

  const form = useForm<TEditProfileSchema>({
    resolver: zodResolver(editProfileSchema),
    defaultValues: {
      name: userDB?.name || firebaseUser?.displayName || "",
      photo: null,
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
      bio: userDB?.bio || "",
      travelStyle: userDB?.travelStyle || "",
    },
  });

  useEffect(() => {
    if (userDB || firebaseUser) {
      form.reset({
        name: userDB?.name || firebaseUser?.displayName || "",
        photo: null,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
        bio: userDB?.bio || "",
        travelStyle: userDB?.travelStyle || "",
      });
      resetUpload(userDB?.imageUrl || firebaseUser?.photoURL || null);
      setShowPasswordSection(false);
    }
  }, [userDB, firebaseUser, isEditMode, form, resetUpload]);

  const handleLogout = async () => {
    await signOut(auth);
  };

  const onSubmit = async (values: TEditProfileSchema) => {
    try {
      setError(null);

      const profileUpdates: {
        name?: string;
        photoURL?: string;
        bio?: string;
        travelStyle?: string;
      } = {};

      if (values.name && values.name !== (userDB?.name || firebaseUser?.displayName)) {
        profileUpdates.name = values.name;
      }
      if (uploadedPhotoURL) {
        profileUpdates.photoURL = uploadedPhotoURL;
      }
      if (values.bio !== userDB?.bio) {
        profileUpdates.bio = values.bio;
      }
      if (values.travelStyle !== userDB?.travelStyle) {
        profileUpdates.travelStyle = values.travelStyle;
      }

      if (Object.keys(profileUpdates).length > 0) {
        await updateProfileMutation.mutateAsync(profileUpdates);
      }

      if (values.newPassword && values.newPassword.length > 0 && values.currentPassword) {
        await updatePasswordMutation.mutateAsync({
          currentPassword: values.currentPassword,
          newPassword: values.newPassword,
        });
      }

      setIsEditMode(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update profile";
      setError(message);
    }
  };

  const handleCancel = () => {
    setIsEditMode(false);
    setError(null);
    setShowPasswordSection(false);
    form.reset();
    resetUpload(userDB?.imageUrl || firebaseUser?.photoURL || null);
  };

  if (firebaseLoading || dbLoading) {
    return (
      <main className='min-h-screen bg-slate-950 p-6'>
        <LoadingState fullScreen />
      </main>
    );
  }

  if (!firebaseUser) {
    return (
      <main className='min-h-screen bg-slate-950 flex items-center justify-center px-4'>
        <div className='text-center max-w-md'>
          <div className='w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10'>
            <User className='w-10 h-10 text-slate-400' />
          </div>
          <p className='text-slate-400 font-medium text-lg'>
            Please sign in to view your profile
          </p>
          <Button
            onClick={() => router.push("/login")}
            className='mt-4 bg-orange-500 hover:bg-orange-600'
          >
            Login
          </Button>
        </div>
      </main>
    );
  }

  const displayName =
    userDB?.name || firebaseUser?.displayName || firebaseUser?.email?.split("@")[0] || "Traveler";
  const avatarUrl = photoPreview || userDB?.imageUrl || firebaseUser?.photoURL || null;
  const email = firebaseUser?.email || "";
  const memberSince = userDB?.createdAt ? new Date(userDB.createdAt) : new Date();

  return (
    <main className='min-h-screen bg-slate-950 pb-24 text-slate-200 overflow-x-hidden font-sans'>
      <PremiumPageHeader
        title='My Profile'
        onBack={() => router.push("/dashboard")}
        actions={
          !isEditMode && (
            <button
              onClick={() => setIsEditMode(true)}
              className='flex items-center justify-center w-10 h-10 rounded-full bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-all active:scale-90'
              title='Edit Profile'
            >
              <Edit className='w-5 h-5' />
            </button>
          )
        }
      />

      <div className='max-w-4xl mx-auto px-6 pt-8 sm:pt-12 pb-8'>
        <ProfileHeader
          displayName={displayName}
          email={email}
          memberSince={memberSince}
          avatarUrl={avatarUrl}
          travelStyle={userDB?.travelStyle}
          bio={userDB?.bio}
          isEditMode={isEditMode}
          uploadingImage={uploadingImage}
          fileInputRef={fileInputRef}
          onFileChange={handleImageUpload}
          onAvatarButtonClick={() => {
            if (isEditMode && !uploadingImage) {
              fileInputRef.current?.click();
            } else if (!isEditMode) {
              setIsEditMode(true);
            }
          }}
          onEditClick={() => setIsEditMode(true)}
          onLogout={handleLogout}
        />

        {(error || uploadError) && (
          <div className='mb-6 space-y-2'>
            {error && (
              <div className='rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200'>
                {error}
              </div>
            )}
            {uploadError && (
              <div className='rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100'>
                {uploadError}
              </div>
            )}
          </div>
        )}

        {isEditMode ? (
          <ProfileEditForm
            form={form}
            onSubmit={onSubmit}
            onCancel={handleCancel}
            isSubmitting={updateProfileMutation.isPending}
            showPasswordSection={showPasswordSection}
            onTogglePasswordSection={() => setShowPasswordSection(!showPasswordSection)}
          />
        ) : (
          <ProfileStats groups={groups} />
        )}
      </div>

      <DashboardBottomNav />
    </main>
  );
};

export default ProfileComponent;
```

- [ ] **Step 6: Verify line counts and types**

Run: `wc -l src/app/components/pages/Profile/index.tsx src/app/components/pages/Profile/components/*.tsx src/hooks/useProfileImageUpload.ts`
Expected: `index.tsx` is roughly 220 lines (down from 601); each new file is under 300 lines.

Run: `npx tsc --noEmit && npm run lint`
Expected: no errors.

- [ ] **Step 7: Manual verification in the browser**

Run: `npm run dev`, sign in, go to `/profile`. Confirm: page loads showing stats/journeys; "Edit Profile" switches to the edit form with existing values pre-filled; changing the avatar shows a preview and uploads; toggling "Update security credentials" shows the password fields; submitting a bio-only change succeeds; submitting a password change with the wrong current password shows an error; "Cancel" discards changes; "Sign Out" logs out.

- [ ] **Step 8: Commit**

```bash
git add src/hooks/useProfileImageUpload.ts src/app/components/pages/Profile
git commit -m "refactor: split Profile page into header/edit-form/stats components"
```

---

### Task 3: Update tracking and open the PR

**Files:**
- Modify: `docs/superpowers/specs/2026-09-22-code-cleanup-design.md` (Profile row status)

- [ ] **Step 1: Mark Profile as done in the spec's tracking table**

In `docs/superpowers/specs/2026-09-22-code-cleanup-design.md`, change the Profile row's Status from "Not started" to "Done".

- [ ] **Step 2: Run the full verification suite one more time**

Run: `npm run lint && npx tsc --noEmit && npm run test`
Expected: all green.

- [ ] **Step 3: Commit, push, and open the PR**

```bash
git add docs/superpowers/specs/2026-09-22-code-cleanup-design.md
git commit -m "docs: mark Profile as migrated in the code cleanup spec"
git push -u origin refactor/profile-service-repo
gh pr create --base dev --head refactor/profile-service-repo \
  --title "refactor: migrate Profile to service/repository architecture" \
  --body "Migrates /api/profile and /api/profile/password to the repository/service/route layering from CLAUDE.md, adds Zod validation on both routes, and splits the 601-line Profile page into ProfileHeader/ProfileEditForm/ProfileStats plus a useProfileImageUpload hook. Two intentional behavior changes: malformed request bodies now get a 400 before touching any service, and unexpected errors return a generic message instead of leaking error.message to the client. Part of docs/superpowers/specs/2026-09-22-code-cleanup-design.md, Pass 1."
gh pr checks --watch
```

Expected: the `checks` workflow (from the Foundation plan) passes. If it fails, fix the root cause and push a follow-up commit before merging.

---

## Definition of Done

- [ ] `src/app/api/profile/repository.ts`, `schemas.ts`, `services.ts` exist; `route.ts` and `password/route.ts` are thin wrappers using `handleApiError`.
- [ ] Both routes validate their request body with Zod before calling a service.
- [ ] `services.test.ts` passes and covers both success paths and every thrown-error branch.
- [ ] `Profile/index.tsx` is under 300 lines; `ProfileHeader`, `ProfileEditForm`, `ProfileStats`, and `useProfileImageUpload` each own one clear responsibility.
- [ ] No `console.*` remains in touched files (the image-upload hook uses `logger.error` instead of the original `console.error`).
- [ ] Manually verified in the browser: view, edit, avatar upload, password change (success and failure), cancel, sign out.
- [ ] Spec tracking table updated; PR open against `dev` with the `checks` workflow green.
