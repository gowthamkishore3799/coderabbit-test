import * as z from "zod";

// ============================================
// Zod v4 Features Demo
// ============================================

// 1. Standalone String Format Schemas (NEW in v4)
const emailSchema = z.email();
const uuidSchema = z.uuid(); // Strict RFC validation
const guidSchema = z.guid(); // Permissive UUID-like validation
const emojiSchema = z.emoji();
const base64Schema = z.base64();
const base64UrlSchema = z.base64url();
const nanoidSchema = z.nanoid();
const cuidSchema = z.cuid();
const cuid2Schema = z.cuid2();
const ulidSchema = z.ulid();
const ipv4Schema = z.ipv4();
const ipv6Schema = z.ipv6();
const cidrv4Schema = z.cidrv4();
const cidrv6Schema = z.cidrv6();

// ISO Format Validators
const isoDateSchema = z.iso.date();
const isoTimeSchema = z.iso.time();
const isoDatetimeSchema = z.iso.datetime();
const isoDurationSchema = z.iso.duration();

// 2. Unified Error Customization
