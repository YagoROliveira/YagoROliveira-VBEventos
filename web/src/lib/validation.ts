export type ParticipantFormValues = {
  name: string;
  email: string;
  phone: string;
};

export type FieldErrors = Partial<Record<keyof ParticipantFormValues, string>>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value: string) {
  return EMAIL_PATTERN.test(value.trim());
}

export function isValidPhone(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits.length >= 10 && digits.length <= 13;
}

export function validateParticipantForm(values: ParticipantFormValues): FieldErrors {
  const errors: FieldErrors = {};

  if (!values.name.trim()) {
    errors.name = "Informe o nome.";
  }

  if (!values.email.trim()) {
    errors.email = "Informe o e-mail.";
  } else if (!isValidEmail(values.email)) {
    errors.email = "Informe um e-mail válido.";
  }

  if (values.phone.trim() && !isValidPhone(values.phone)) {
    errors.phone = "Informe um telefone válido, com DDD.";
  }

  return errors;
}
