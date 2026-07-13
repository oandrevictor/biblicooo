import type { CharacterRole, Gender, HistoricalEra, Testament } from "./types";

export const TESTAMENT_LABELS: Record<Testament, string> = {
  old: "Antigo Testamento",
  new: "Novo Testamento"
};

export const GENDER_LABELS: Record<Exclude<Gender, null>, string> = {
  male: "Masculino",
  female: "Feminino",
  unknown: "Desconhecido"
};

export const ERA_LABELS: Record<HistoricalEra, string> = {
  origins: "Origens",
  patriarchs: "Patriarcas",
  exodus: "Êxodo",
  conquest: "Conquista",
  judges: "Juízes",
  monarchy: "Monarquia",
  exile: "Exílio",
  return: "Retorno",
  jesus: "Ministério de Jesus",
  early_church: "Igreja primitiva",
  prophecy: "Profecia"
};

export const CHARACTER_ROLE_LABELS: Record<CharacterRole, string> = {
  patriarch_matriarch: "Patriarca/Matriarca",
  prophet: "Profeta",
  priest_levite: "Sacerdote ou levita",
  judge_deliverer: "Juiz ou libertador",
  monarch: "Monarca",
  apostle: "Apóstolo",
  disciple_follower: "Discípulo ou seguidor",
  church_leader_missionary: "Líder ou missionário",
  political_ruler: "Governante",
  opponent: "Opositor",
  family_member: "Familiar",
  other: "Outro"
};

export function formatGender(gender: Gender) {
  return gender === null ? "Não se aplica" : GENDER_LABELS[gender];
}

export function formatCharacterRole(role: CharacterRole | null) {
  return role === null ? "Não se aplica" : CHARACTER_ROLE_LABELS[role];
}
