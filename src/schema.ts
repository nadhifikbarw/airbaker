export type BaseSchema = {
  tables: TableSchema[];
};

export type TableSchema = {
  id: string;
  name: string;
  primaryFieldId: string;
  fields: FieldSchema[];
  views: ViewSchema[];
};

export type ViewSchema = {
  id: string;
  name: string;
  type:
    | "grid"
    | "form"
    | "calendar"
    | "gallery"
    | "kanban"
    | "timeline"
    | "block";
  visibleFieldIds?: string[];
};

export type FieldSchema =
  | SingleLineTextFieldSchema
  | EmailFieldSchema
  | URLFieldSchema
  | MultilineTextFieldSchema
  | PercentFieldSchema
  | NumberFieldSchema
  | CurrencyFieldSchema
  | SingleSelectFieldSchema
  | MultipleSelectFieldSchema
  | SingleCollaboratorFieldSchema
  | MultipleCollaboratorsFieldSchema
  | MultipleRecordLinksFieldSchema
  | DateFieldSchema
  | DateTimeFieldSchema
  | PhoneNumberFieldSchema
  | MultipleAttachmentsFieldSchema
  | CheckboxFieldSchema
  | FormulaFieldSchema
  | CreatedTimeFieldSchema
  | RollupFieldSchema
  | CountFieldSchema
  | LookupFieldSchema
  | MultipleLookupValuesFieldSchema
  | AutoNumberFieldSchema
  | BarcodeFieldSchema
  | RatingFieldSchema
  | RichTextFieldSchema
  | DurationFieldSchema
  | LastModifiedTimeFieldSchema
  | ButtonFieldSchema
  | CreatedByFieldSchema
  | LastModifiedByFieldSchema
  | ExternalSyncSourceFieldSchema
  | AITextFieldSchema
  | UndocumentedFieldSchema;

export type Bare<O extends { type?: any; options?: any }> = Pick<
  O,
  "type" | "options"
>;

export type BareFieldSchema =
  | Bare<SingleLineTextFieldSchema>
  | Bare<EmailFieldSchema>
  | Bare<URLFieldSchema>
  | Bare<MultilineTextFieldSchema>
  | Bare<PercentFieldSchema>
  | Bare<NumberFieldSchema>
  | Bare<CurrencyFieldSchema>
  | Bare<SingleSelectFieldSchema>
  | Bare<MultipleSelectFieldSchema>
  | Bare<SingleCollaboratorFieldSchema>
  | Bare<MultipleCollaboratorsFieldSchema>
  | Bare<MultipleRecordLinksFieldSchema>
  | Bare<DateFieldSchema>
  | Bare<DateTimeFieldSchema>
  | Bare<PhoneNumberFieldSchema>
  | Bare<MultipleAttachmentsFieldSchema>
  | Bare<CheckboxFieldSchema>
  | Bare<FormulaFieldSchema>
  | Bare<CreatedTimeFieldSchema>
  | Bare<RollupFieldSchema>
  | Bare<CountFieldSchema>
  | Bare<LookupFieldSchema>
  | Bare<MultipleLookupValuesFieldSchema>
  | Bare<AutoNumberFieldSchema>
  | Bare<BarcodeFieldSchema>
  | Bare<RatingFieldSchema>
  | Bare<RichTextFieldSchema>
  | Bare<DurationFieldSchema>
  | Bare<LastModifiedTimeFieldSchema>
  | Bare<ButtonFieldSchema>
  | Bare<CreatedByFieldSchema>
  | Bare<LastModifiedByFieldSchema>
  | Bare<ExternalSyncSourceFieldSchema>
  | Bare<AITextFieldSchema>
  | Bare<UndocumentedFieldSchema>;

export type SingleLineTextFieldSchema = {
  type: "singleLineText";
} & BaseFieldSchema;

export type EmailFieldSchema = {
  type: "email";
} & BaseFieldSchema;

export type URLFieldSchema = {
  type: "url";
} & BaseFieldSchema;

export type MultilineTextFieldSchema = {
  type: "multilineText";
} & BaseFieldSchema;

export type NumberFieldSchema = {
  type: "number";
  options: {
    precision: number;
  };
} & BaseFieldSchema;

export type PercentFieldSchema = {
  type: "percent";
  options: {
    precision: number;
  };
} & BaseFieldSchema;

export type CurrencyFieldSchema = {
  type: "currency";
  options: {
    precision: number;
    symbol: string;
  };
} & BaseFieldSchema;

export type SingleSelectFieldSchema = {
  type: "singleSelect";
  options: {
    choices: FieldChoice[];
  };
} & BaseFieldSchema;

export type MultipleSelectFieldSchema = {
  type: "multipleSelects";
  options: {
    choices: FieldChoice[];
  };
};

export type SingleCollaboratorFieldSchema = {
  type: "singleCollaborator";
} & BaseFieldSchema;

export type MultipleCollaboratorsFieldSchema = {
  type: "multipleCollaborators";
} & BaseFieldSchema;

export type MultipleRecordLinksFieldSchema = {
  type: "multipleRecordLinks";
  options: {
    isReversed: boolean;
    linkedTableId: string;
    prefersSingleRecordLink: boolean;
    inverseLinkFieldId?: string;
    viewIdForRecordSelection?: string;
  };
} & BaseFieldSchema;

export type DateFormatOptions = {
  format: "l" | "LL" | "M/D/YYYY" | "D/M/YYYY" | "YYYY-MM-DD";
  name: "local" | "friendly" | "us" | "european" | "iso";
};

export type TimeFormatOptions = {
  format: "h:mma" | "HH:mm";
  name: "12hour" | "24hour";
};

export type DateFieldSchema = {
  type: "date";
  options: DateFormatOptions;
} & BaseFieldSchema;

export type DateTimeFieldSchema = {
  type: "dateTime";
  options: {
    timeZone: AirtableTimezone;
    dateFormat: DateFormatOptions;
    timeFormat: TimeFormatOptions;
  };
};

export type PhoneNumberFieldSchema = {
  type: "phoneNumber";
} & BaseFieldSchema;

export type MultipleAttachmentsFieldSchema = {
  type: "multipleAttachments";
} & BaseFieldSchema;

export type CheckboxFieldSchema = {
  type: "checkbox";
  options: {
    color: CheckboxAirtableColor;
    icon: CheckboxAirtableIcon;
  };
} & BaseFieldSchema;

export type FormulaFieldSchema = {
  type: "formula";
  options: {
    formula: string;
    isValid: boolean;
    referencedFieldIds: string[] | null;
    result: BareFieldSchema;
  };
} & BaseFieldSchema;

export type CreatedTimeFieldSchema = {
  type: "createdTime";
  options: {
    result: Pick<DateFieldSchema | DateTimeFieldSchema, "type" | "options">;
  };
} & BaseFieldSchema;

export type RollupFieldSchema = {
  type: "rollup";
  options: {
    fieldIdInLinkedTable?: string;
    recordLinkFieldId?: string;
    result?: BareFieldSchema | null;
    isValid?: boolean;
    referencedFieldIds?: string[];
  };
} & BaseFieldSchema;

export type CountFieldSchema = {
  type: "count";
  options: {
    isValid: boolean;
    recordLinkFieldId?: string | null;
  };
} & BaseFieldSchema;

export type LookupFieldSchema = {
  type: "lookup";
  options: {
    fieldIdInLinkedTable: string | null;
    isValid: boolean;
    recordLinkFieldId: string | null;
    result: BareFieldSchema | null;
  };
} & BaseFieldSchema;

export type MultipleLookupValuesFieldSchema = {
  type: "multipleLookupValues";
} & BaseFieldSchema;

export type AutoNumberFieldSchema = {
  type: "autoNumber";
} & BaseFieldSchema;

export type BarcodeFieldSchema = {
  type: "barcode";
} & BaseFieldSchema;

export type RatingFieldSchema = {
  type: "rating";
  options: {
    color: CheckboxAirtableColor;
    icon: CheckboxAirtableIcon;
    max: number;
  };
} & BaseFieldSchema;

export type RichTextFieldSchema = {
  type: "richText";
} & BaseFieldSchema;

export type DurationFieldSchema = {
  type: "duration";
  options: {
    durationFormat:
      | "h:mm"
      | "h:mm:ss"
      | "h:mm:ss.S"
      | "h:mm:ss.SS"
      | "h:mm:ss.SSS";
  };
} & BaseFieldSchema;

export type LastModifiedTimeFieldSchema = {
  type: "lastModifiedTime";
  options: {
    isValid: boolean;
    referencedFieldIds: string[] | null;
    result: Pick<
      DateFieldSchema | DateTimeFieldSchema,
      "type" | "options"
    > | null;
  };
} & BaseFieldSchema;

export type ButtonFieldSchema = {
  type: "button";
} & BaseFieldSchema;

export type CreatedByFieldSchema = {
  type: "createdBy";
} & BaseFieldSchema;

export type LastModifiedByFieldSchema = {
  type: "lastModifiedBy";
} & BaseFieldSchema;

export type ExternalSyncSourceFieldSchema = {
  type: "externalSyncSource";
  options: {
    choices: FieldChoice[];
  };
} & BaseFieldSchema;

export type AITextFieldSchema = {
  type: "aiText";
  options: {
    prompt?: (string | { field: { fieldId: string } })[];
    referencedFieldIds?: string[];
  };
} & BaseFieldSchema;

// https://airtable.com/developers/web/api/field-model
// Airtable doesn't consider newly added field schema as breaking changes
// same as newly added options object props

export type UndocumentedFieldSchema = {
  type: string;
  options?: Record<string, unknown>;
};

export type BaseFieldSchema = {
  id: string;
  name: string;
  description: string;
};

export type CheckboxAirtableIcon =
  | "check"
  | "xCheckbox"
  | "star"
  | "heart"
  | "thumbsUp"
  | "flag"
  | "dot";

export type CheckboxAirtableColor =
  | "yellowBright"
  | "orangeBright"
  | "redBright"
  | "pinkBright"
  | "purpleBright"
  | "blueBright"
  | "cyanBright"
  | "tealBright"
  | "greenBright"
  | "grayBright";

export type ChoiceAirtableColor =
  | "blueLight2"
  | "cyanLight2"
  | "tealLight2"
  | "greenLight2"
  | "yellowLight2"
  | "orangeLight2"
  | "redLight2"
  | "pinkLight2"
  | "purpleLight2"
  | "grayLight2"
  | "blueLight1"
  | "cyanLight1"
  | "tealLight1"
  | "greenLight1"
  | "yellowLight1"
  | "orangeLight1"
  | "redLight1"
  | "pinkLight1"
  | "purpleLight1"
  | "grayLight1"
  | "blueBright"
  | "cyanBright"
  | "tealBright"
  | "greenBright"
  | "yellowBright"
  | "orangeBright"
  | "redBright"
  | "pinkBright"
  | "purpleBright"
  | "grayBright"
  | "blueDark1"
  | "cyanDark1"
  | "tealDark1"
  | "greenDark1"
  | "yellowDark1"
  | "orangeDark1"
  | "redDark1"
  | "pinkDark1"
  | "purpleDark1"
  | "grayDark1";

export type AirtableTimezone =
  | "utc"
  | "client"
  | "Africa/Abidjan"
  | "Africa/Accra"
  | "Africa/Addis_Ababa"
  | "Africa/Algiers"
  | "Africa/Asmara"
  | "Africa/Bamako"
  | "Africa/Bangui"
  | "Africa/Banjul"
  | "Africa/Bissau"
  | "Africa/Blantyre"
  | "Africa/Brazzaville"
  | "Africa/Bujumbura"
  | "Africa/Cairo"
  | "Africa/Casablanca"
  | "Africa/Ceuta"
  | "Africa/Conakry"
  | "Africa/Dakar"
  | "Africa/Dar_es_Salaam"
  | "Africa/Djibouti"
  | "Africa/Douala"
  | "Africa/El_Aaiun"
  | "Africa/Freetown"
  | "Africa/Gaborone"
  | "Africa/Harare"
  | "Africa/Johannesburg"
  | "Africa/Juba"
  | "Africa/Kampala"
  | "Africa/Khartoum"
  | "Africa/Kigali"
  | "Africa/Kinshasa"
  | "Africa/Lagos"
  | "Africa/Libreville"
  | "Africa/Lome"
  | "Africa/Luanda"
  | "Africa/Lubumbashi"
  | "Africa/Lusaka"
  | "Africa/Malabo"
  | "Africa/Maputo"
  | "Africa/Maseru"
  | "Africa/Mbabane"
  | "Africa/Mogadishu"
  | "Africa/Monrovia"
  | "Africa/Nairobi"
  | "Africa/Ndjamena"
  | "Africa/Niamey"
  | "Africa/Nouakchott"
  | "Africa/Ouagadougou"
  | "Africa/Porto-Novo"
  | "Africa/Sao_Tome"
  | "Africa/Tripoli"
  | "Africa/Tunis"
  | "Africa/Windhoek"
  | "America/Adak"
  | "America/Anchorage"
  | "America/Anguilla"
  | "America/Antigua"
  | "America/Araguaina"
  | "America/Argentina/Buenos_Aires"
  | "America/Argentina/Catamarca"
  | "America/Argentina/Cordoba"
  | "America/Argentina/Jujuy"
  | "America/Argentina/La_Rioja"
  | "America/Argentina/Mendoza"
  | "America/Argentina/Rio_Gallegos"
  | "America/Argentina/Salta"
  | "America/Argentina/San_Juan"
  | "America/Argentina/San_Luis"
  | "America/Argentina/Tucuman"
  | "America/Argentina/Ushuaia"
  | "America/Aruba"
  | "America/Asuncion"
  | "America/Atikokan"
  | "America/Bahia"
  | "America/Bahia_Banderas"
  | "America/Barbados"
  | "America/Belem"
  | "America/Belize"
  | "America/Blanc-Sablon"
  | "America/Boa_Vista"
  | "America/Bogota"
  | "America/Boise"
  | "America/Cambridge_Bay"
  | "America/Campo_Grande"
  | "America/Cancun"
  | "America/Caracas"
  | "America/Cayenne"
  | "America/Cayman"
  | "America/Chicago"
  | "America/Chihuahua"
  | "America/Costa_Rica"
  | "America/Creston"
  | "America/Cuiaba"
  | "America/Curacao"
  | "America/Danmarkshavn"
  | "America/Dawson"
  | "America/Dawson_Creek"
  | "America/Denver"
  | "America/Detroit"
  | "America/Dominica"
  | "America/Edmonton"
  | "America/Eirunepe"
  | "America/El_Salvador"
  | "America/Fort_Nelson"
  | "America/Fortaleza"
  | "America/Glace_Bay"
  | "America/Godthab"
  | "America/Goose_Bay"
  | "America/Grand_Turk"
  | "America/Grenada"
  | "America/Guadeloupe"
  | "America/Guatemala"
  | "America/Guayaquil"
  | "America/Guyana"
  | "America/Halifax"
  | "America/Havana"
  | "America/Hermosillo"
  | "America/Indiana/Indianapolis"
  | "America/Indiana/Knox"
  | "America/Indiana/Marengo"
  | "America/Indiana/Petersburg"
  | "America/Indiana/Tell_City"
  | "America/Indiana/Vevay"
  | "America/Indiana/Vincennes"
  | "America/Indiana/Winamac"
  | "America/Inuvik"
  | "America/Iqaluit"
  | "America/Jamaica"
  | "America/Juneau"
  | "America/Kentucky/Louisville"
  | "America/Kentucky/Monticello"
  | "America/Kralendijk"
  | "America/La_Paz"
  | "America/Lima"
  | "America/Los_Angeles"
  | "America/Lower_Princes"
  | "America/Maceio"
  | "America/Managua"
  | "America/Manaus"
  | "America/Marigot"
  | "America/Martinique"
  | "America/Matamoros"
  | "America/Mazatlan"
  | "America/Menominee"
  | "America/Merida"
  | "America/Metlakatla"
  | "America/Mexico_City"
  | "America/Miquelon"
  | "America/Moncton"
  | "America/Monterrey"
  | "America/Montevideo"
  | "America/Montserrat"
  | "America/Nassau"
  | "America/New_York"
  | "America/Nipigon"
  | "America/Nome"
  | "America/Noronha"
  | "America/North_Dakota/Beulah"
  | "America/North_Dakota/Center"
  | "America/North_Dakota/New_Salem"
  | "America/Nuuk"
  | "America/Ojinaga"
  | "America/Panama"
  | "America/Pangnirtung"
  | "America/Paramaribo"
  | "America/Phoenix"
  | "America/Port-au-Prince"
  | "America/Port_of_Spain"
  | "America/Porto_Velho"
  | "America/Puerto_Rico"
  | "America/Punta_Arenas"
  | "America/Rainy_River"
  | "America/Rankin_Inlet"
  | "America/Recife"
  | "America/Regina"
  | "America/Resolute"
  | "America/Rio_Branco"
  | "America/Santarem"
  | "America/Santiago"
  | "America/Santo_Domingo"
  | "America/Sao_Paulo"
  | "America/Scoresbysund"
  | "America/Sitka"
  | "America/St_Barthelemy"
  | "America/St_Johns"
  | "America/St_Kitts"
  | "America/St_Lucia"
  | "America/St_Thomas"
  | "America/St_Vincent"
  | "America/Swift_Current"
  | "America/Tegucigalpa"
  | "America/Thule"
  | "America/Thunder_Bay"
  | "America/Tijuana"
  | "America/Toronto"
  | "America/Tortola"
  | "America/Vancouver"
  | "America/Whitehorse"
  | "America/Winnipeg"
  | "America/Yakutat"
  | "America/Yellowknife"
  | "Antarctica/Casey"
  | "Antarctica/Davis"
  | "Antarctica/DumontDUrville"
  | "Antarctica/Macquarie"
  | "Antarctica/Mawson"
  | "Antarctica/McMurdo"
  | "Antarctica/Palmer"
  | "Antarctica/Rothera"
  | "Antarctica/Syowa"
  | "Antarctica/Troll"
  | "Antarctica/Vostok"
  | "Arctic/Longyearbyen"
  | "Asia/Aden"
  | "Asia/Almaty"
  | "Asia/Amman"
  | "Asia/Anadyr"
  | "Asia/Aqtau"
  | "Asia/Aqtobe"
  | "Asia/Ashgabat"
  | "Asia/Atyrau"
  | "Asia/Baghdad"
  | "Asia/Bahrain"
  | "Asia/Baku"
  | "Asia/Bangkok"
  | "Asia/Barnaul"
  | "Asia/Beirut"
  | "Asia/Bishkek"
  | "Asia/Brunei"
  | "Asia/Chita"
  | "Asia/Choibalsan"
  | "Asia/Colombo"
  | "Asia/Damascus"
  | "Asia/Dhaka"
  | "Asia/Dili"
  | "Asia/Dubai"
  | "Asia/Dushanbe"
  | "Asia/Famagusta"
  | "Asia/Gaza"
  | "Asia/Hebron"
  | "Asia/Ho_Chi_Minh"
  | "Asia/Hong_Kong"
  | "Asia/Hovd"
  | "Asia/Irkutsk"
  | "Asia/Istanbul"
  | "Asia/Jakarta"
  | "Asia/Jayapura"
  | "Asia/Jerusalem"
  | "Asia/Kabul"
  | "Asia/Kamchatka"
  | "Asia/Karachi"
  | "Asia/Kathmandu"
  | "Asia/Khandyga"
  | "Asia/Kolkata"
  | "Asia/Krasnoyarsk"
  | "Asia/Kuala_Lumpur"
  | "Asia/Kuching"
  | "Asia/Kuwait"
  | "Asia/Macau"
  | "Asia/Magadan"
  | "Asia/Makassar"
  | "Asia/Manila"
  | "Asia/Muscat"
  | "Asia/Nicosia"
  | "Asia/Novokuznetsk"
  | "Asia/Novosibirsk"
  | "Asia/Omsk"
  | "Asia/Oral"
  | "Asia/Phnom_Penh"
  | "Asia/Pontianak"
  | "Asia/Pyongyang"
  | "Asia/Qatar"
  | "Asia/Qostanay"
  | "Asia/Qyzylorda"
  | "Asia/Rangoon"
  | "Asia/Riyadh"
  | "Asia/Sakhalin"
  | "Asia/Samarkand"
  | "Asia/Seoul"
  | "Asia/Shanghai"
  | "Asia/Singapore"
  | "Asia/Srednekolymsk"
  | "Asia/Taipei"
  | "Asia/Tashkent"
  | "Asia/Tbilisi"
  | "Asia/Tehran"
  | "Asia/Thimphu"
  | "Asia/Tokyo"
  | "Asia/Tomsk"
  | "Asia/Ulaanbaatar"
  | "Asia/Urumqi"
  | "Asia/Ust-Nera"
  | "Asia/Vientiane"
  | "Asia/Vladivostok"
  | "Asia/Yakutsk"
  | "Asia/Yangon"
  | "Asia/Yekaterinburg"
  | "Asia/Yerevan"
  | "Atlantic/Azores"
  | "Atlantic/Bermuda"
  | "Atlantic/Canary"
  | "Atlantic/Cape_Verde"
  | "Atlantic/Faroe"
  | "Atlantic/Madeira"
  | "Atlantic/Reykjavik"
  | "Atlantic/South_Georgia"
  | "Atlantic/St_Helena"
  | "Atlantic/Stanley"
  | "Australia/Adelaide"
  | "Australia/Brisbane"
  | "Australia/Broken_Hill"
  | "Australia/Currie"
  | "Australia/Darwin"
  | "Australia/Eucla"
  | "Australia/Hobart"
  | "Australia/Lindeman"
  | "Australia/Lord_Howe"
  | "Australia/Melbourne"
  | "Australia/Perth"
  | "Australia/Sydney"
  | "Europe/Amsterdam"
  | "Europe/Andorra"
  | "Europe/Astrakhan"
  | "Europe/Athens"
  | "Europe/Belgrade"
  | "Europe/Berlin"
  | "Europe/Bratislava"
  | "Europe/Brussels"
  | "Europe/Bucharest"
  | "Europe/Budapest"
  | "Europe/Busingen"
  | "Europe/Chisinau"
  | "Europe/Copenhagen"
  | "Europe/Dublin"
  | "Europe/Gibraltar"
  | "Europe/Guernsey"
  | "Europe/Helsinki"
  | "Europe/Isle_of_Man"
  | "Europe/Istanbul"
  | "Europe/Jersey"
  | "Europe/Kaliningrad"
  | "Europe/Kiev"
  | "Europe/Kirov"
  | "Europe/Lisbon"
  | "Europe/Ljubljana"
  | "Europe/London"
  | "Europe/Luxembourg"
  | "Europe/Madrid"
  | "Europe/Malta"
  | "Europe/Mariehamn"
  | "Europe/Minsk"
  | "Europe/Monaco"
  | "Europe/Moscow"
  | "Europe/Nicosia"
  | "Europe/Oslo"
  | "Europe/Paris"
  | "Europe/Podgorica"
  | "Europe/Prague"
  | "Europe/Riga"
  | "Europe/Rome"
  | "Europe/Samara"
  | "Europe/San_Marino"
  | "Europe/Sarajevo"
  | "Europe/Saratov"
  | "Europe/Simferopol"
  | "Europe/Skopje"
  | "Europe/Sofia"
  | "Europe/Stockholm"
  | "Europe/Tallinn"
  | "Europe/Tirane"
  | "Europe/Ulyanovsk"
  | "Europe/Uzhgorod"
  | "Europe/Vaduz"
  | "Europe/Vatican"
  | "Europe/Vienna"
  | "Europe/Vilnius"
  | "Europe/Volgograd"
  | "Europe/Warsaw"
  | "Europe/Zagreb"
  | "Europe/Zaporozhye"
  | "Europe/Zurich"
  | "Indian/Antananarivo"
  | "Indian/Chagos"
  | "Indian/Christmas"
  | "Indian/Cocos"
  | "Indian/Comoro"
  | "Indian/Kerguelen"
  | "Indian/Mahe"
  | "Indian/Maldives"
  | "Indian/Mauritius"
  | "Indian/Mayotte"
  | "Indian/Reunion"
  | "Pacific/Apia"
  | "Pacific/Auckland"
  | "Pacific/Bougainville"
  | "Pacific/Chatham"
  | "Pacific/Chuuk"
  | "Pacific/Easter"
  | "Pacific/Efate"
  | "Pacific/Enderbury"
  | "Pacific/Fakaofo"
  | "Pacific/Fiji"
  | "Pacific/Funafuti"
  | "Pacific/Galapagos"
  | "Pacific/Gambier"
  | "Pacific/Guadalcanal"
  | "Pacific/Guam"
  | "Pacific/Honolulu"
  | "Pacific/Kanton"
  | "Pacific/Kiritimati"
  | "Pacific/Kosrae"
  | "Pacific/Kwajalein"
  | "Pacific/Majuro"
  | "Pacific/Marquesas"
  | "Pacific/Midway"
  | "Pacific/Nauru"
  | "Pacific/Niue"
  | "Pacific/Norfolk"
  | "Pacific/Noumea"
  | "Pacific/Pago_Pago"
  | "Pacific/Palau"
  | "Pacific/Pitcairn"
  | "Pacific/Pohnpei"
  | "Pacific/Port_Moresby"
  | "Pacific/Rarotonga"
  | "Pacific/Saipan"
  | "Pacific/Tahiti"
  | "Pacific/Tarawa"
  | "Pacific/Tongatapu"
  | "Pacific/Wake"
  | "Pacific/Wallis";

export type FieldChoice = {
  id: string;
  color?: ChoiceAirtableColor;
  name: string;
};
