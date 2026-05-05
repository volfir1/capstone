import Counter from "../models/counter.js";

const FINALIZE_CASE_NUMBER_RULES = [
  {
    key: "rejected",
    label: "Rejected",
    prefix: "REJ",
    matches: ({ decision }) => decision === "rejected",
  },
  {
    key: "pending",
    label: "Pending",
    prefix: "PND",
    matches: ({ decision }) => decision === "pending",
  },
  {
    key: "legal-advice",
    label: "Legal Advice",
    prefix: "ADV",
    matches: ({ decision, caseType }) => decision === "accepted" && caseType === "legal-advice",
  },
  {
    key: "legal-document",
    label: "Document Drafting",
    prefix: "DOC",
    matches: ({ decision, caseType }) => decision === "accepted" && caseType === "legal-document",
  },
  {
    key: "court-representation",
    label: "Court Representation",
    prefix: "CRT",
    matches: ({ decision, caseType }) => decision === "accepted" && caseType === "court-representation",
  },
];

const FALLBACK_CASE_NUMBER_RULE = {
  key: "other",
  label: "Other",
  prefix: "OTH",
};

const normalizeValue = (value) => String(value || "").trim().toLowerCase();

const getCaseType = (record = {}) =>
  normalizeValue(record?.content?.interviewInfo?.caseType || record?.caseType || record?.category);

const getDecision = (record = {}) => normalizeValue(record?.decision);

export const getFinalizeCaseNumberRule = (record = {}) => {
  const caseType = getCaseType(record);
  const decision = getDecision(record);

  return (
    FINALIZE_CASE_NUMBER_RULES.find((rule) => rule.matches({ decision, caseType })) || FALLBACK_CASE_NUMBER_RULE
  );
};

export const getFinalizeCaseNumberYear = (record = {}) => {
  const sourceDate = record?.createdAt || record?.finalizedAt || new Date();
  const date = sourceDate instanceof Date ? sourceDate : new Date(sourceDate);

  if (Number.isNaN(date.getTime())) {
    return new Date().getFullYear();
  }

  return date.getFullYear();
};

export const buildFinalizeCaseNumberKey = (prefix, year) => `finalize-case-number:${prefix}:${year}`;

export const formatFinalizeCaseNumber = (prefix, year, sequence) =>
  `${prefix}-${year}-${String(sequence).padStart(4, "0")}`;

export const allocateFinalizeCaseNumber = async (record = {}) => {
  const rule = getFinalizeCaseNumberRule(record);
  const year = getFinalizeCaseNumberYear(record);
  const counterKey = buildFinalizeCaseNumberKey(rule.prefix, year);

  const counter = await Counter.findOneAndUpdate(
    { _id: counterKey, year },
    { $inc: { sequence: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  return {
    caseNumber: formatFinalizeCaseNumber(rule.prefix, year, counter.sequence || 1),
    prefix: rule.prefix,
    label: rule.label,
    year,
    sequence: counter.sequence || 1,
  };
};