import { supabase } from "../lib/supabaseClient";
import { getImageDimensionsError } from "../lib/venueImageRules";

function getVenueImagesBucket() {
  return import.meta.env.VITE_SUPABASE_VENUE_IMAGES_BUCKET || "venue-images";
}

const venueImageExtensions = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

function normalizeText(value) {
  return typeof value === "string" ? value : "";
}

export function validateVenueImageFiles(files) {
  for (const file of files) {
    if (!venueImageExtensions[file.type]) {
      throw new Error("صيغة الصورة غير مدعومة. استخدم JPG أو PNG أو WebP.");
    }
    if (file.size > 5 * 1024 * 1024) {
      throw new Error("حجم كل صورة يجب ألا يتجاوز 5MB.");
    }
  }
}

async function getVenueImagesByVenueIds(venueIds) {
  const imagesByVenueId = new Map();
  if (!venueIds.length) return imagesByVenueId;

  const { data, error } = await supabase
    .from("venue_images")
    .select("id, venue_id, image_url, sort_order")
    .in("venue_id", venueIds)
    .order("sort_order");

  if (error) throw error;
  for (const image of data ?? []) {
    const images = imagesByVenueId.get(String(image.venue_id)) ?? [];
    images.push(image);
    imagesByVenueId.set(String(image.venue_id), images);
  }
  return imagesByVenueId;
}

export async function getVenues() {
  const { data, error } = await supabase
    .from("venues")
    .select("*")
    .eq("is_active", true)
    .eq("approval_status", "approved")
    .order("name");

  if (error) throw error;
  const venues = data ?? [];
  const imagesByVenueId = await getVenueImagesByVenueIds(venues.map((venue) => venue.id));
  return venues.map((venue) => ({
    ...venue,
    images: imagesByVenueId.get(String(venue.id)) ?? [],
  }));
}

export async function getFeaturedVenues(limit = 4) {
  const { data, error } = await supabase
    .from("venues")
    .select("*")
    .eq("is_active", true)
    .eq("approval_status", "approved")
    .order("name")
    .limit(limit);

  if (error) throw error;
  const venues = data ?? [];
  const imagesByVenueId = await getVenueImagesByVenueIds(venues.map((venue) => venue.id));
  return venues.map((venue) => ({
    ...venue,
    images: imagesByVenueId.get(String(venue.id)) ?? [],
  }));
}

export async function searchVenues(searchTerm) {
  const venues = await getVenues();
  const term = searchTerm.trim().toLocaleLowerCase();
  if (!term) return venues;

  return venues.filter((venue) =>
    [venue.name, venue.address, venue.area, venue.city]
      .filter(Boolean)
      .some((value) => value.toLocaleLowerCase().includes(term)),
  );
}

export async function getVenueById(venueId) {
  const { data, error } = await supabase
    .from("venues")
    .select("*")
    .eq("id", venueId)
    .eq("is_active", true)
    .maybeSingle();

  if (error) throw error;
  if (!data) return data;
  const imagesByVenueId = await getVenueImagesByVenueIds([data.id]);
  return { ...data, images: imagesByVenueId.get(String(data.id)) ?? [] };
}

export async function getVenueImages(venueId) {
  const imagesByVenueId = await getVenueImagesByVenueIds([venueId]);
  return imagesByVenueId.get(String(venueId)) ?? [];
}

export async function saveVenueImages({ venueId, ownerId, files }) {
  validateVenueImageFiles(files);
  if (!files.length) return;

  const bucket = getVenueImagesBucket();
  const { data: lastImage, error: loadImagesError } = await supabase
    .from("venue_images")
    .select("sort_order")
    .eq("venue_id", venueId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (loadImagesError) throw loadImagesError;

  const uploadedImages = [];
  try {
    for (const [index, file] of files.entries()) {
      const path = `${ownerId}/${venueId}/${crypto.randomUUID()}.${venueImageExtensions[file.type]}`;
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(path, file, { contentType: file.type, upsert: false });
      if (uploadError) {
        if (uploadError.message.toLowerCase().includes("bucket not found")) {
          throw new Error(
            `مخزن صور الملاعب "${bucket}" غير موجود. أنشئه من Supabase Dashboard > Storage > New bucket، واجعله Public.`,
          );
        }
        throw uploadError;
      }

      const { data: publicUrl } = supabase.storage.from(bucket).getPublicUrl(path);
      uploadedImages.push({
        venue_id: venueId,
        image_url: publicUrl.publicUrl,
        sort_order: (lastImage?.sort_order ?? -1) + index + 1,
        path,
      });
    }

    const { error: saveImagesError } = await supabase.from("venue_images").insert(
      uploadedImages.map((image) => ({
        venue_id: image.venue_id,
        image_url: image.image_url,
        sort_order: image.sort_order,
      })),
    );
    if (saveImagesError) throw saveImagesError;
  } catch (saveError) {
    const paths = uploadedImages.map((image) => image.path);
    if (paths.length) {
      const { error: cleanupError } = await supabase.storage.from(bucket).remove(paths);
      if (cleanupError) {
        throw new Error(`${saveError.message} كما تعذر حذف الصور المرفوعة: ${cleanupError.message}`);
      }
    }
    throw saveError;
  }
}

export async function getVenueBookingInfo(venueId) {
  const [hoursResult, methodsResult] = await Promise.all([
    supabase
      .from("venue_working_hours")
      .select("day_of_week, open_time, close_time")
      .eq("venue_id", venueId)
      .order("day_of_week")
      .order("open_time"),
    supabase
      .from("venue_payment_methods")
      .select("method, account")
      .eq("venue_id", venueId),
  ]);

  if (hoursResult.error) throw hoursResult.error;
  if (methodsResult.error) throw methodsResult.error;

  return {
    workingHours: hoursResult.data ?? [],
    paymentMethods: methodsResult.data ?? [],
  };
}

export async function getOwnerVenues(ownerId) {
  const { data, error } = await supabase
    .from("venues")
    .select("*")
    .eq("owner_id", ownerId)
    .order("name");

  if (error) throw error;
  return data ?? [];
}

export async function getOwnerVenueById(venueId, ownerId) {
  const { data, error } = await supabase
    .from("venues")
    .select("*")
    .eq("id", venueId)
    .eq("owner_id", ownerId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function saveVenue({ venueId, ownerId, venue, workingHours, paymentMethods }) {
  const query = venueId
    ? supabase.from("venues").update(venue).eq("id", venueId).eq("owner_id", ownerId)
    : supabase.from("venues").insert({ ...venue, owner_id: ownerId });
  const { data, error } = await query.select("*").single();

  if (error) throw error;
  if (!data) throw new Error("لم يتم حفظ بيانات الملعب.");

  const { error: deleteHoursError } = await supabase
    .from("venue_working_hours")
    .delete()
    .eq("venue_id", data.id);
  if (deleteHoursError) {
    throw new Error(`تم حفظ بيانات الملعب لكن تعذر استبدال مواعيد العمل القديمة: ${deleteHoursError.message}`);
  }

  const hoursToSave = workingHours
    .filter((hours) => hours.open_time && hours.close_time)
    .map((hours) => ({
      venue_id: data.id,
      day_of_week: hours.day_of_week,
      open_time: hours.open_time,
      close_time: hours.close_time,
    }));

  if (hoursToSave.length) {
    const { error: insertHoursError } = await supabase
      .from("venue_working_hours")
      .insert(hoursToSave);
    if (insertHoursError) {
      throw new Error(`تم حفظ بيانات الملعب لكن تعذر حفظ مواعيد العمل: ${insertHoursError.message}`);
    }
  }

  const { error: deleteMethodsError } = await supabase
    .from("venue_payment_methods")
    .delete()
    .eq("venue_id", data.id);
  if (deleteMethodsError) {
    throw new Error(`تم حفظ بيانات الملعب لكن تعذر استبدال طرق الدفع القديمة: ${deleteMethodsError.message}`);
  }

  const methodsToSave = paymentMethods
    .filter((method) => normalizeText(method.method) && normalizeText(method.account).trim())
    .map((method) => ({
      venue_id: data.id,
      method: method.method,
      account: normalizeText(method.account).trim(),
    }));

  if (methodsToSave.length) {
    const { error: insertMethodsError } = await supabase
      .from("venue_payment_methods")
      .insert(methodsToSave);
    if (insertMethodsError) {
      throw new Error(`تم حفظ الملعب لكن تعذر حفظ طرق الدفع: ${insertMethodsError.message}`);
    }
  }

  return data;
}

export async function getAdminOverview() {
  const [profilesResult, venuesResult] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("venues").select("id", { count: "exact", head: true }),
  ]);
  const failedResult = [profilesResult, venuesResult].find((r) => r.error);
  if (failedResult) throw failedResult.error;

  let bookingCount = 0;
  let platformCommission = 0;
  const pageSize = 1000;
  let from = 0;
  while (true) {
    const { data, error } = await supabase
      .from("bookings")
      .select("commission_amount, payout_status")
      .range(from, from + pageSize - 1);
    if (error) throw error;

    bookingCount += data.length;
    for (const booking of data) {
      if (
        booking.payout_status !== "refunded" &&
        booking.commission_amount != null
      ) {
        platformCommission += Number(booking.commission_amount) || 0;
      }
    }
    if (data.length < pageSize) break;
    from += pageSize;
  }

  return {
    profiles: profilesResult.count ?? 0,
    venues: venuesResult.count ?? 0,
    bookings: bookingCount,
    platformCommission,
  };
}
// الصق الدالتين دول في آخر ملف src/services/venuesService.js
// (بيستخدموا supabase و getOwnerVenues و getVenueImagesByVenueIds الموجودين في الملف نفسه)

export async function getOwnerVenuesWithImages(ownerId) {
  const venues = await getOwnerVenues(ownerId);
  const imagesByVenueId = await getVenueImagesByVenueIds(
    venues.map((venue) => venue.id),
  );
  return venues.map((venue) => ({
    ...venue,
    images: imagesByVenueId.get(String(venue.id)) ?? [],
  }));
}

export async function setVenueActive({ venueId, ownerId, isActive }) {
  const { data, error } = await supabase
    .from("venues")
    .update({ is_active: isActive })
    .eq("id", venueId)
    .eq("owner_id", ownerId)
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

function readImageSize(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: image.naturalWidth, height: image.naturalHeight });
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("تعذر قراءة الصورة. تأكد إن الملف صورة سليمة."));
    };
    image.src = url;
  });
}

// فحص صورة واحدة: الصيغة والحجم والأبعاد. بترمي Error برسالة عربي لو مرفوضة.
export async function validateVenueImageFile(file) {
  validateVenueImageFiles([file]);
  const { width, height } = await readImageSize(file);
  const message = getImageDimensionsError(width, height);
  if (message) throw new Error(message);
}

// مسار الملف داخل الـ bucket من رابط الصورة العام
function getStoragePathFromUrl(url, bucket) {
  const marker = `/object/public/${bucket}/`;
  const index = url.indexOf(marker);
  if (index === -1) return null;
  return decodeURIComponent(url.slice(index + marker.length).split("?")[0]);
}

// حذف صورة: الصف من venue_images والملف من الـ Storage
export async function removeVenueImage(image) {
  const bucket = getVenueImagesBucket();

  const { data: deletedRows, error } = await supabase
    .from("venue_images")
    .delete()
    .eq("id", image.id)
    .select("id");
  if (error) throw error;
  if (!deletedRows?.length) {
    throw new Error(
      "تعذر حذف الصورة. غالبًا مفيش صلاحية حذف على جدول venue_images في Supabase.",
    );
  }

  const path = getStoragePathFromUrl(image.image_url, bucket);
  if (!path) return;

  const { data: removedFiles, error: storageError } = await supabase.storage
    .from(bucket)
    .remove([path]);
  if (storageError) {
    throw new Error(`تم حذف الصورة لكن تعذر حذف الملف من التخزين: ${storageError.message}`);
  }
  if (!removedFiles?.length) {
    throw new Error(
      "تم حذف الصورة لكن الملف فضل في التخزين. غالبًا مفيش صلاحية حذف على الـ bucket في Supabase.",
    );
  }
}

// استبدال صورة: بنرفع الجديدة الأول وبعدين نحذف القديمة، فالملعب مايفضلش من غير صورة لو حصل خطأ
export async function replaceVenueImage({ venueId, ownerId, file, existingImage }) {
  await validateVenueImageFile(file);
  await saveVenueImages({ venueId, ownerId, files: [file] });
  if (existingImage) await removeVenueImage(existingImage);
}
export async function resubmitVenue(venueId) {
  const { error } = await supabase.rpc("owner_resubmit_venue", {
    p_venue_id: venueId,
  });
  if (error) throw error;
}
