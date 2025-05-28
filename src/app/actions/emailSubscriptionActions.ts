
'use server';

import { z } from 'zod';

const emailSubscriptionSchema = z.object({
  name: z.string().min(2, "Ad Soyad en az 2 karakter olmalıdır."),
  email: z.string().email("Geçerli bir e-posta adresi giriniz."),
});

interface ActionResult {
  success: boolean;
  message?: string;
  errors?: {
    name?: string[];
    email?: string[];
    general?: string[];
  };
}

export async function handleEmailSubscription(
  formData: FormData
): Promise<ActionResult> {
  const rawFormData = {
    name: formData.get('name'),
    email: formData.get('email'),
  };

  const validatedFields = emailSubscriptionSchema.safeParse(rawFormData);

  if (!validatedFields.success) {
    return {
      success: false,
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Lütfen formdaki hataları düzeltin.",
    };
  }

  const { name, email } = validatedFields.data;

  console.log(`E-posta Uyarısı Abonelik İsteği Alındı:`);
  console.log(`Ad Soyad: ${name}`);
  console.log(`E-posta: ${email}`);
  console.log(`Bu kullanıcıya normalde havadurumuxsite@gmail.com adresinden bir uyarı e-postası gönderilecekti (simülasyon).`);

  // Gerçek bir uygulamada burada e-posta adresini veritabanına kaydetme,
  // bir e-posta gönderme servisini çağırma gibi işlemler yapılır.
  // Bu prototipte sadece konsola logluyoruz.

  return {
    success: true,
    message: `${name} (${email}), e-posta uyarıları için abonelik bilgileriniz kaydedildi (simülasyon).`,
  };
}

    