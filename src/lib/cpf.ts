export function validateCPF(cpf: string): boolean {
  if (!cpf) return false;

  const numbers = cpf.replace(/\D/g, '');
  if (numbers.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(numbers)) return false;

  const validateDigit = (sliceEnd: number, weightStart: number) => {
    let sum = 0;
    for (let i = 0; i < sliceEnd; i++) {
      sum += parseInt(numbers.charAt(i), 10) * (weightStart - i);
    }
    let remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    return remainder;
  };

  const firstDigit = validateDigit(9, 10);
  if (firstDigit !== parseInt(numbers.charAt(9), 10)) return false;
  const secondDigit = validateDigit(10, 11);
  if (secondDigit !== parseInt(numbers.charAt(10), 10)) return false;

  return true;
}

export function formatCPF(input: string): string {
  const numbers = input.replace(/\D/g, '');
  if (!numbers) return '';
  if (numbers.length <= 3) return numbers;
  if (numbers.length <= 6) return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
  if (numbers.length <= 9) {
    return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}`;
  }
  return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(
    9,
    11,
  )}`;
}
