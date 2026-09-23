import {
  defaultSignupFields,
  removeSignupField,
  type SignupField,
} from '../../activities/model/signupFields';
import type { ContestSignupField } from './contest';

export const REGION_FIELD_KEY = '所属区域';

export function regionSignupField(): ContestSignupField {
  return {
    key: REGION_FIELD_KEY,
    label: '所属区域',
    source: 'preset',
    inputType: 'region',
    required: true,
    fixed: true,
  };
}

export function defaultContestSignupFields(): ContestSignupField[] {
  return [...defaultSignupFields(), regionSignupField()];
}

export function activitySignupFieldsOf(fields: ContestSignupField[]): SignupField[] {
  return fields.filter((field) => field.inputType !== 'region') as SignupField[];
}

export function mergeContestSignupFields(activityFields: SignupField[], all: ContestSignupField[]): ContestSignupField[] {
  const region = all.find((field) => field.key === REGION_FIELD_KEY) ?? regionSignupField();
  return [...activityFields, region];
}

export function removeContestSignupField(fields: ContestSignupField[], key: string): ContestSignupField[] {
  if (key === REGION_FIELD_KEY) return fields;
  return [
    ...removeSignupField(fields.filter((field) => field.inputType !== 'region') as SignupField[], key),
    ...fields.filter((field) => field.inputType === 'region'),
  ];
}

export function hasFixedRegionField(fields: ContestSignupField[]): boolean {
  return fields.some((field) => field.key === REGION_FIELD_KEY && field.fixed);
}
