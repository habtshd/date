/**
 * Server-side age calculation enforcing the adult-only (18+) dating policy.
 * Frontend client input is never trusted as the source of truth for age.
 */
export function calculateAge(dateOfBirth: Date): number {
  const now = new Date();

  let age = now.getFullYear() - dateOfBirth.getFullYear();
  const month = now.getMonth() - dateOfBirth.getMonth();

  if (
    month < 0 ||
    (month === 0 && now.getDate() < dateOfBirth.getDate())
  ) {
    age--;
  }

  return age;
}
