// utils/validation.js
export const validateCV = (data) => {
  const errors = {};

  if (!data.name || data.name.trim() === "") {
    errors.name = "Nome é obrigatório";
  }

  if (data.contact?.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.contact.email)) {
    errors.email = "Email inválido";
  }

  if (data.contact?.phone && !/^\+?[0-9\s-]{9,15}$/.test(data.contact.phone)) {
    errors.phone = "Telefone inválido";
  }

  if (data.experience?.length > 0) {
    data.experience.forEach((exp, i) => {
      if (!exp.title) errors[`exp_${i}_title`] = "Título obrigatório";
      if (!exp.company) errors[`exp_${i}_company`] = "Empresa obrigatória";
    });
  }

  return errors;
};

export const validateTemplate = (data) => {
  const errors = {};

  if (!data.name || data.name.trim() === "") {
    errors.name = "Nome do template é obrigatório";
  }

  if (!data.body || data.body.trim() === "") {
    errors.body = "Conteúdo do template é obrigatório";
  }

  return errors;
};

export const validateLogin = (data) => {
  const errors = {};

  if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = "Email inválido";
  }

  if (!data.password || data.password.length < 6) {
    errors.password = "Password deve ter pelo menos 6 caracteres";
  }

  return errors;
};

export const validateRegister = (data) => {
  const errors = {};

  if (!data.name || data.name.trim() === "") {
    errors.name = "Nome é obrigatório";
  }

  if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = "Email inválido";
  }

  if (!data.password || data.password.length < 6) {
    errors.password = "Password deve ter pelo menos 6 caracteres";
  }

  if (data.password !== data.confirmPassword) {
    errors.confirmPassword = "Passwords não coincidem";
  }

  return errors;
};