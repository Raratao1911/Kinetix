import React, { useId } from "react";
import { getCountries, getCountryCallingCode, parsePhoneNumberFromString } from "libphonenumber-js";
import { Metadata } from "libphonenumber-js/core";
import phoneMetadata from "libphonenumber-js/metadata.min.json";

const names = new Intl.DisplayNames(["pt-BR"], { type: "region" });
const countries = getCountries().sort((a, b) => names.of(a).localeCompare(names.of(b), "pt-BR"));
const metadata = new Metadata(phoneMetadata);
const limits = Object.fromEntries(countries.map(country => {
  metadata.selectNumberingPlan(country);
  return [country, Math.min(Math.max(...metadata.possibleLengths()), 15 - getCountryCallingCode(country).length)];
}));
const fieldClass = "mt-1 h-11 w-full min-w-0 rounded border border-slate-300 bg-white px-3 text-base font-normal outline-none focus:border-sky dark:border-darkTheme-border dark:bg-darkTheme-surface dark:text-darkTheme-text";

export function phoneToInternational(value, country, required = false) {
  const phone = value.trim() ? parsePhoneNumberFromString(value, country) : null;
  if ((required || value.trim()) && (!phone?.isPossible() || phone.countryCallingCode !== getCountryCallingCode(country))) {
    throw new Error("Informe um telefone válido para o país selecionado.");
  }
  return phone?.number || null;
}

export default function PhoneFields({ country, value, onCountryChange, onChange, required = false,
  countryLabel = "País do telefone", phoneLabel = "Telefone" }) {
  const labelId = useId();
  function updatePhone(raw) {
    const parsed = parsePhoneNumberFromString(raw, country);
    const number = parsed?.isPossible() && parsed.countryCallingCode === getCountryCallingCode(country)
      ? parsed.nationalNumber : raw.replace(/\D/g, "");
    if (number.length <= limits[country]) onChange(number);
  }
  return (
    <div className="min-w-0 space-y-4">
      <label className="block text-sm font-medium leading-6 text-slate-700 dark:text-slate-300">
        <span id={labelId}>{countryLabel}</span>
        <select aria-labelledby={labelId} className={fieldClass} value={country} onChange={event => {
          onCountryChange(event.target.value);
          onChange("");
        }}>
          {countries.map(item => <option key={item} value={item}>+{getCountryCallingCode(item)} ({names.of(item)})</option>)}
        </select>
      </label>
      <label className="block text-sm font-medium leading-6 text-slate-700 dark:text-slate-300">
        {phoneLabel}
        <input className={fieldClass} type="tel" inputMode="numeric" autoComplete="tel-national" pattern="[0-9]+"
          value={value} onChange={event => updatePhone(event.target.value)} required={required} />
      </label>
    </div>
  );
}
