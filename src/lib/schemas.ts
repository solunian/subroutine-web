import * as v from "valibot";
import { Constants } from "$lib/types/database.types";

export const NormalStrSchema = v.pipe(v.string("invalid string"), v.normalize());

export const TrimNormalStrSchema = v.pipe(NormalStrSchema, v.trim());

export function empty_to_null<TSchema extends v.BaseSchema<any, any, any>>(wrapped: TSchema) {
  return v.pipe(
    TrimNormalStrSchema,
    v.transform((val) => (val === "" ? null : val)),
    v.nullable(wrapped)
  );
}

export function empty_to_undefined<TSchema extends v.BaseSchema<any, any, any>>(wrapped: TSchema) {
  return v.pipe(
    TrimNormalStrSchema,
    v.transform((val) => (val === "" ? undefined : val)),
    v.optional(wrapped)
  );
}

export const UUIDSchema = v.pipe(TrimNormalStrSchema, v.uuid("invalid uuid"));

export const EmailSchema = v.pipe(TrimNormalStrSchema, v.email("invalid email"));

export const PasswordSchema = v.pipe(
  TrimNormalStrSchema,
  v.minGraphemes(6, "invalid password: must have a length greater or equal to 6")
);

export const UsernameSchema = v.pipe(
  TrimNormalStrSchema,
  v.minGraphemes(3, "invalid username: must have a length greater or equal to 3"),
  v.maxGraphemes(32, "invalid username: must have a length less than or equal to 32"),
  v.regex(
    /^(?!.*\.{2})[a-z0-9_.]+$/,
    "invalid username: must only contain lowercase letters, numbers, underscores, and non-consecutive periods"
  )
);

// idk why this didnt work for nullable() like with the TrimNormalStrSchema. wtf...
export const URLSchema = v.pipe(TrimNormalStrSchema, v.url("invalid url"));

export const DateTimeSchema = v.pipe(TrimNormalStrSchema, v.isoDateTime("invalid iso datetime"));

export const TimestampSchema = v.pipe(TrimNormalStrSchema, v.isoTimestamp("invalid iso timestamp"));

// supabase defined enums
export const SubroutineType = v.picklist(Constants.public.Enums.subroutine_type);

export const RelationshipStatusType = v.picklist(Constants.public.Enums.relationship_status_type);

export const FinNumberSchema = v.pipe(
  TrimNormalStrSchema,
  v.transform((input) => {
    // If it's a blank string, throw an error
    if (input.trim() === "") {
      return new v.ValiError([
        {
          type: "string",
          kind: "validation",
          expected: "valid number string",
          received: "empty string",
          input,
          message: "empty string is not a valid number",
        },
      ]);
    }
    return input;
  }),
  v.toNumber("invalid number"),
  v.finite("invalid finite number")
);
