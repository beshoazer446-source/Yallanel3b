// قواعد صور الملاعب. غيّر الأرقام هنا بس وكل حاجة بتتحدث.
export const VENUE_IMAGE_RULES = {
  minWidth: 1000,
  minHeight: 600,
  minRatio: 1.2, // العرض ÷ الطول (تقريبًا 5:4)
  maxRatio: 2, // 2:1
  recommendedLabel: "1600×900",
};

// بترجع رسالة خطأ بالعربي، أو "" لو الأبعاد مقبولة
export function getImageDimensionsError(width, height) {
  const { minWidth, minHeight, minRatio, maxRatio } = VENUE_IMAGE_RULES;
  const size = `${width}×${height}`;

  if (height > width) {
    return `الصورة طولها أكبر من عرضها (${size}). اختار صورة أفقية.`;
  }
  if (width < minWidth || height < minHeight) {
    return `الصورة صغيرة (${size}). الحد الأدنى ${minWidth}×${minHeight}.`;
  }

  const ratio = width / height;
  if (ratio < minRatio) {
    return `الصورة قريبة من المربع (${size}). اختار صورة أفقية بنسبة أقرب لـ 16:9.`;
  }
  if (ratio > maxRatio) {
    return `الصورة عريضة جدًا (${size}). النسبة المناسبة بين 5:4 و2:1.`;
  }
  return "";
}
