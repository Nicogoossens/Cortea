import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import type { SupportedLanguage } from "./i18n";

export type RegionCode =
  | "GB" | "US" | "AE" | "CN" | "JP" | "FR" | "DE" | "NL" | "AU" | "CA"
  | "IT" | "IN" | "ES" | "PT" | "SG" | "BR" | "ZA" | "MX" | "CO" | "BE" | "CH"
  | "AF" | "AL" | "DZ" | "AD" | "AO" | "AG" | "AR" | "AW" | "AT" | "BS"
  | "BH" | "BD" | "BB" | "BY" | "BZ" | "BJ" | "BM" | "BT" | "BO" | "BA"
  | "BW" | "BN" | "BG" | "BF" | "BI" | "KH" | "CM" | "CV" | "KY" | "CF"
  | "TD" | "CL" | "KM" | "CK" | "CR" | "CI" | "HR" | "CU" | "CW" | "CY"
  | "CZ" | "CD" | "DK" | "DJ" | "DM" | "DO" | "EC" | "EG" | "SV" | "GQ"
  | "ER" | "EE" | "SZ" | "ET" | "FO" | "FM" | "FJ" | "FI" | "PF" | "GA"
  | "GM" | "GH" | "GR" | "GL" | "GD" | "GT" | "GN" | "GW" | "GY" | "HT"
  | "HN" | "HK" | "HU" | "IS" | "ID" | "IR" | "IQ" | "IE" | "IL" | "JM"
  | "JO" | "KZ" | "KE" | "KI" | "XK" | "KW" | "KG" | "LA" | "LV" | "LB"
  | "LS" | "LR" | "LY" | "LI" | "LT" | "LU" | "MO" | "MG" | "MW" | "MY"
  | "MV" | "ML" | "MT" | "MH" | "MR" | "MU" | "MD" | "MC" | "MN" | "ME"
  | "MA" | "MZ" | "MM" | "NA" | "NR" | "NP" | "NZ" | "NI" | "NE" | "NG"
  | "NU" | "KP" | "MK" | "NO" | "OM" | "PK" | "PW" | "PS" | "PA" | "PG"
  | "PY" | "PE" | "PH" | "PL" | "QA" | "CG" | "RO" | "RU" | "RW" | "BL"
  | "KN" | "LC" | "VC" | "WS" | "SM" | "ST" | "SA" | "SN" | "RS" | "SL"
  | "SK" | "SI" | "SB" | "SO" | "KR" | "SS" | "LK" | "SD" | "SR" | "SE"
  | "SY" | "TW" | "TJ" | "TZ" | "TH" | "TL" | "TG" | "TO" | "TT" | "TN"
  | "TR" | "TM" | "TC" | "TV" | "UG" | "UA" | "UY" | "UZ" | "VU" | "VA"
  | "VE" | "VN" | "YE" | "ZM" | "ZW";

export type Continent = "europe" | "americas" | "asia_pacific" | "middle_east_africa";

export interface CompassRegion {
  code: RegionCode;
  flag: RegionCode;
  continent: Continent;
  names: Record<SupportedLanguage, string>;
}

export const COMPASS_REGIONS: CompassRegion[] = [
  { code: "GB", flag: "GB", continent: "europe", names: { en: "United Kingdom", nl: "Verenigd Koninkrijk", fr: "Royaume-Uni", de: "Vereinigtes Königreich", es: "Reino Unido", pt: "Reino Unido", it: "Regno Unito", ar: "المملكة المتحدة", ja: "英国", zh: "英国" } },
  { code: "US", flag: "US", continent: "americas", names: { en: "United States", nl: "Verenigde Staten", fr: "États-Unis", de: "Vereinigte Staaten", es: "Estados Unidos", pt: "Estados Unidos", it: "Stati Uniti", ar: "الولايات المتحدة", ja: "アメリカ合衆国", zh: "美国" } },
  { code: "AE", flag: "AE", continent: "middle_east_africa", names: { en: "UAE / Dubai", nl: "VAE / Dubai", fr: "Émirats Arabes", de: "VAE / Dubai", es: "EAU / Dubái", pt: "EAU / Dubai", it: "EAU / Dubai", ar: "الإمارات / دبي", ja: "UAE / ドバイ", zh: "阿联酋 / 迪拜" } },
  { code: "CN", flag: "CN", continent: "asia_pacific", names: { en: "China", nl: "China", fr: "Chine", de: "China", es: "China", pt: "China", it: "Cina", ar: "الصين", ja: "中国", zh: "中国" } },
  { code: "JP", flag: "JP", continent: "asia_pacific", names: { en: "Japan", nl: "Japan", fr: "Japon", de: "Japan", es: "Japón", pt: "Japão", it: "Giappone", ar: "اليابان", ja: "日本", zh: "日本" } },
  { code: "FR", flag: "FR", continent: "europe", names: { en: "France", nl: "Frankrijk", fr: "France", de: "Frankreich", es: "Francia", pt: "França", it: "Francia", ar: "فرنسا", ja: "フランス", zh: "法国" } },
  { code: "DE", flag: "DE", continent: "europe", names: { en: "Germany", nl: "Duitsland", fr: "Allemagne", de: "Deutschland", es: "Alemania", pt: "Alemanha", it: "Germania", ar: "ألمانيا", ja: "ドイツ", zh: "德国" } },
  { code: "NL", flag: "NL", continent: "europe", names: { en: "Netherlands", nl: "Nederland", fr: "Pays-Bas", de: "Niederlande", es: "Países Bajos", pt: "Países Baixos", it: "Paesi Bassi", ar: "هولندا", ja: "オランダ", zh: "荷兰" } },
  { code: "AU", flag: "AU", continent: "asia_pacific", names: { en: "Australia", nl: "Australië", fr: "Australie", de: "Australien", es: "Australia", pt: "Austrália", it: "Australia", ar: "أستراليا", ja: "オーストラリア", zh: "澳大利亚" } },
  { code: "CA", flag: "CA", continent: "americas", names: { en: "Canada", nl: "Canada", fr: "Canada", de: "Kanada", es: "Canadá", pt: "Canadá", it: "Canada", ar: "كندا", ja: "カナダ", zh: "加拿大" } },
  { code: "IT", flag: "IT", continent: "europe", names: { en: "Italy", nl: "Italië", fr: "Italie", de: "Italien", es: "Italia", pt: "Itália", it: "Italia", ar: "إيطاليا", ja: "イタリア", zh: "意大利" } },
  { code: "IN", flag: "IN", continent: "asia_pacific", names: { en: "India", nl: "India", fr: "Inde", de: "Indien", es: "India", pt: "Índia", it: "India", ar: "الهند", ja: "インド", zh: "印度" } },
  { code: "ES", flag: "ES", continent: "europe", names: { en: "Spain", nl: "Spanje", fr: "Espagne", de: "Spanien", es: "España", pt: "Espanha", it: "Spagna", ar: "إسبانيا", ja: "スペイン", zh: "西班牙" } },
  { code: "PT", flag: "PT", continent: "europe", names: { en: "Portugal", nl: "Portugal", fr: "Portugal", de: "Portugal", es: "Portugal", pt: "Portugal", it: "Portogallo", ar: "البرتغال", ja: "ポルトガル", zh: "葡萄牙" } },
  { code: "SG", flag: "SG", continent: "asia_pacific", names: { en: "Singapore", nl: "Singapore", fr: "Singapour", de: "Singapur", es: "Singapur", pt: "Singapura", it: "Singapore", ar: "سنغافورة", ja: "シンガポール", zh: "新加坡" } },
  { code: "BR", flag: "BR", continent: "americas", names: { en: "Brazil", nl: "Brazilië", fr: "Brésil", de: "Brasilien", es: "Brasil", pt: "Brasil", it: "Brasile", ar: "البرازيل", ja: "ブラジル", zh: "巴西" } },
  { code: "ZA", flag: "ZA", continent: "middle_east_africa", names: { en: "South Africa", nl: "Zuid-Afrika", fr: "Afrique du Sud", de: "Südafrika", es: "Sudáfrica", pt: "África do Sul", it: "Sudafrica", ar: "جنوب أفريقيا", ja: "南アフリカ", zh: "南非" } },
  { code: "MX", flag: "MX", continent: "americas", names: { en: "Mexico", nl: "Mexico", fr: "Mexique", de: "Mexiko", es: "México", pt: "México", it: "Messico", ar: "المكسيك", ja: "メキシコ", zh: "墨西哥" } },
  { code: "CO", flag: "CO", continent: "americas", names: { en: "Colombia", nl: "Colombia", fr: "Colombie", de: "Kolumbien", es: "Colombia", pt: "Colômbia", it: "Colombia", ar: "كولومبيا", ja: "コロンビア", zh: "哥伦比亚" } },
  { code: "BE", flag: "BE", continent: "europe", names: { en: "Belgium", nl: "België", fr: "Belgique", de: "Belgien", es: "Bélgica", pt: "Bélgica", it: "Belgio", ar: "بلجيكا", ja: "ベルギー", zh: "比利时" } },
  { code: "CH", flag: "CH", continent: "europe", names: { en: "Switzerland", nl: "Zwitserland", fr: "Suisse", de: "Schweiz", es: "Suiza", pt: "Suíça", it: "Svizzera", ar: "سويسرا", ja: "スイス", zh: "瑞士" } },
  { code: "AF", flag: "AF", continent: "asia_pacific", names: { en: "Afghanistan", nl: "Afghanistan", fr: "Afghanistan", de: "Afghanistan", es: "Afganistán", pt: "Afeganistão", it: "Afghanistan", ar: "أفغانستان", ja: "アフガニスタン", zh: "阿富汗" } },
  { code: "AL", flag: "AL", continent: "europe", names: { en: "Albania", nl: "Albanië", fr: "Albanie", de: "Albanien", es: "Albania", pt: "Albânia", it: "Albania", ar: "ألبانيا", ja: "アルバニア", zh: "阿尔巴尼亚" } },
  { code: "DZ", flag: "DZ", continent: "middle_east_africa", names: { en: "Algeria", nl: "Algerije", fr: "Algérie", de: "Algerien", es: "Argelia", pt: "Argélia", it: "Algeria", ar: "الجزائر", ja: "アルジェリア", zh: "阿尔及利亚" } },
  { code: "AD", flag: "AD", continent: "europe", names: { en: "Andorra", nl: "Andorra", fr: "Andorre", de: "Andorra", es: "Andorra", pt: "Andorra", it: "Andorra", ar: "أندورا", ja: "アンドラ", zh: "安道尔" } },
  { code: "AO", flag: "AO", continent: "middle_east_africa", names: { en: "Angola", nl: "Angola", fr: "Angola", de: "Angola", es: "Angola", pt: "Angola", it: "Angola", ar: "أنغولا", ja: "アンゴラ", zh: "安哥拉" } },
  { code: "AG", flag: "AG", continent: "americas", names: { en: "Antigua and Barbuda", nl: "Antigua en Barbuda", fr: "Antigua-et-Barbuda", de: "Antigua und Barbuda", es: "Antigua y Barbuda", pt: "Antígua e Barbuda", it: "Antigua e Barbuda", ar: "أنتيغوا وبربودا", ja: "アンティグア・バーブーダ", zh: "安提瓜和巴布达" } },
  { code: "AR", flag: "AR", continent: "americas", names: { en: "Argentina", nl: "Argentinië", fr: "Argentine", de: "Argentinien", es: "Argentina", pt: "Argentina", it: "Argentina", ar: "الأرجنتين", ja: "アルゼンチン", zh: "阿根廷" } },
  { code: "AW", flag: "AW", continent: "americas", names: { en: "Aruba", nl: "Aruba", fr: "Aruba", de: "Aruba", es: "Aruba", pt: "Aruba", it: "Aruba", ar: "أروبا", ja: "アルバ", zh: "阿鲁巴" } },
  { code: "AT", flag: "AT", continent: "europe", names: { en: "Austria", nl: "Oostenrijk", fr: "Autriche", de: "Österreich", es: "Austria", pt: "Áustria", it: "Austria", ar: "النمسا", ja: "オーストリア", zh: "奥地利" } },
  { code: "BS", flag: "BS", continent: "americas", names: { en: "Bahamas", nl: "Bahamas", fr: "Bahamas", de: "Bahamas", es: "Bahamas", pt: "Bahamas", it: "Bahamas", ar: "باهاماس", ja: "バハマ", zh: "巴哈马" } },
  { code: "BH", flag: "BH", continent: "middle_east_africa", names: { en: "Bahrain", nl: "Bahrein", fr: "Bahreïn", de: "Bahrain", es: "Baréin", pt: "Barém", it: "Bahrein", ar: "البحرين", ja: "バーレーン", zh: "巴林" } },
  { code: "BD", flag: "BD", continent: "asia_pacific", names: { en: "Bangladesh", nl: "Bangladesh", fr: "Bangladesh", de: "Bangladesch", es: "Bangladés", pt: "Bangladesh", it: "Bangladesh", ar: "بنغلاديش", ja: "バングラデシュ", zh: "孟加拉国" } },
  { code: "BB", flag: "BB", continent: "americas", names: { en: "Barbados", nl: "Barbados", fr: "Barbade", de: "Barbados", es: "Barbados", pt: "Barbados", it: "Barbados", ar: "بربادوس", ja: "バルバドス", zh: "巴巴多斯" } },
  { code: "BY", flag: "BY", continent: "europe", names: { en: "Belarus", nl: "Wit-Rusland", fr: "Biélorussie", de: "Weißrussland", es: "Bielorrusia", pt: "Bielorrússia", it: "Bielorussia", ar: "بيلاروس", ja: "ベラルーシ", zh: "白俄罗斯" } },
  { code: "BZ", flag: "BZ", continent: "americas", names: { en: "Belize", nl: "Belize", fr: "Belize", de: "Belize", es: "Belice", pt: "Belize", it: "Belize", ar: "بليز", ja: "ベリーズ", zh: "伯利兹" } },
  { code: "BJ", flag: "BJ", continent: "middle_east_africa", names: { en: "Benin", nl: "Benin", fr: "Bénin", de: "Benin", es: "Benín", pt: "Benin", it: "Benin", ar: "بنين", ja: "ベナン", zh: "贝宁" } },
  { code: "BM", flag: "BM", continent: "americas", names: { en: "Bermuda", nl: "Bermuda", fr: "Bermudes", de: "Bermuda", es: "Bermudas", pt: "Bermuda", it: "Bermuda", ar: "برمودا", ja: "バミューダ", zh: "百慕大" } },
  { code: "BT", flag: "BT", continent: "asia_pacific", names: { en: "Bhutan", nl: "Bhutan", fr: "Bhoutan", de: "Bhutan", es: "Bután", pt: "Butão", it: "Bhutan", ar: "بوتان", ja: "ブータン", zh: "不丹" } },
  { code: "BO", flag: "BO", continent: "americas", names: { en: "Bolivia", nl: "Bolivia", fr: "Bolivie", de: "Bolivien", es: "Bolivia", pt: "Bolívia", it: "Bolivia", ar: "بوليفيا", ja: "ボリビア", zh: "玻利维亚" } },
  { code: "BA", flag: "BA", continent: "europe", names: { en: "Bosnia and Herzegovina", nl: "Bosnië-Herzegovina", fr: "Bosnie-Herzégovine", de: "Bosnien und Herzegowina", es: "Bosnia y Herzegovina", pt: "Bósnia e Herzegovina", it: "Bosnia ed Erzegovina", ar: "البوسنة والهرسك", ja: "ボスニア・ヘルツェゴビナ", zh: "波斯尼亚和黑塞哥维那" } },
  { code: "BW", flag: "BW", continent: "middle_east_africa", names: { en: "Botswana", nl: "Botswana", fr: "Botswana", de: "Botswana", es: "Botsuana", pt: "Botswana", it: "Botswana", ar: "بوتسوانا", ja: "ボツワナ", zh: "博茨瓦纳" } },
  { code: "BN", flag: "BN", continent: "asia_pacific", names: { en: "Brunei", nl: "Brunei", fr: "Brunei", de: "Brunei", es: "Brunéi", pt: "Brunei", it: "Brunei", ar: "بروناي", ja: "ブルネイ", zh: "文莱" } },
  { code: "BG", flag: "BG", continent: "europe", names: { en: "Bulgaria", nl: "Bulgarije", fr: "Bulgarie", de: "Bulgarien", es: "Bulgaria", pt: "Bulgária", it: "Bulgaria", ar: "بلغاريا", ja: "ブルガリア", zh: "保加利亚" } },
  { code: "BF", flag: "BF", continent: "middle_east_africa", names: { en: "Burkina Faso", nl: "Burkina Faso", fr: "Burkina Faso", de: "Burkina Faso", es: "Burkina Faso", pt: "Burkina Faso", it: "Burkina Faso", ar: "بوركينا فاسو", ja: "ブルキナファソ", zh: "布基纳法索" } },
  { code: "BI", flag: "BI", continent: "middle_east_africa", names: { en: "Burundi", nl: "Burundi", fr: "Burundi", de: "Burundi", es: "Burundi", pt: "Burundi", it: "Burundi", ar: "بوروندي", ja: "ブルンジ", zh: "布隆迪" } },
  { code: "KH", flag: "KH", continent: "asia_pacific", names: { en: "Cambodia", nl: "Cambodja", fr: "Cambodge", de: "Kambodscha", es: "Camboya", pt: "Camboja", it: "Cambogia", ar: "كمبوديا", ja: "カンボジア", zh: "柬埔寨" } },
  { code: "CM", flag: "CM", continent: "middle_east_africa", names: { en: "Cameroon", nl: "Kameroen", fr: "Cameroun", de: "Kamerun", es: "Camerún", pt: "Camarões", it: "Camerun", ar: "الكاميرون", ja: "カメルーン", zh: "喀麦隆" } },
  { code: "CV", flag: "CV", continent: "middle_east_africa", names: { en: "Cape Verde", nl: "Kaapverdië", fr: "Cap-Vert", de: "Cabo Verde", es: "Cabo Verde", pt: "Cabo Verde", it: "Capo Verde", ar: "الرأس الأخضر", ja: "カーボベルデ", zh: "佛得角" } },
  { code: "KY", flag: "KY", continent: "americas", names: { en: "Cayman Islands", nl: "Caymaneilanden", fr: "Îles Caïmans", de: "Kaimaninseln", es: "Islas Caimán", pt: "Ilhas Cayman", it: "Isole Cayman", ar: "جزر كايمان", ja: "ケイマン諸島", zh: "开曼群岛" } },
  { code: "CF", flag: "CF", continent: "middle_east_africa", names: { en: "Central African Republic", nl: "Centraal-Afrikaanse Republiek", fr: "République centrafricaine", de: "Zentralafrikanische Republik", es: "República Centroafricana", pt: "República Centro-Africana", it: "Repubblica Centrafricana", ar: "جمهورية أفريقيا الوسطى", ja: "中央アフリカ共和国", zh: "中非共和国" } },
  { code: "TD", flag: "TD", continent: "middle_east_africa", names: { en: "Chad", nl: "Tsjaad", fr: "Tchad", de: "Tschad", es: "Chad", pt: "Chade", it: "Ciad", ar: "تشاد", ja: "チャド", zh: "乍得" } },
  { code: "CL", flag: "CL", continent: "americas", names: { en: "Chile", nl: "Chili", fr: "Chili", de: "Chile", es: "Chile", pt: "Chile", it: "Cile", ar: "تشيلي", ja: "チリ", zh: "智利" } },
  { code: "KM", flag: "KM", continent: "middle_east_africa", names: { en: "Comoros", nl: "Comoren", fr: "Comores", de: "Komoren", es: "Comoras", pt: "Comores", it: "Comore", ar: "جزر القمر", ja: "コモロ", zh: "科摩罗" } },
  { code: "CK", flag: "CK", continent: "asia_pacific", names: { en: "Cook Islands", nl: "Cookeilanden", fr: "Îles Cook", de: "Cookinseln", es: "Islas Cook", pt: "Ilhas Cook", it: "Isole Cook", ar: "جزر كوك", ja: "クック諸島", zh: "库克群岛" } },
  { code: "CR", flag: "CR", continent: "americas", names: { en: "Costa Rica", nl: "Costa Rica", fr: "Costa Rica", de: "Costa Rica", es: "Costa Rica", pt: "Costa Rica", it: "Costa Rica", ar: "كوستاريكا", ja: "コスタリカ", zh: "哥斯达黎加" } },
  { code: "CI", flag: "CI", continent: "middle_east_africa", names: { en: "Côte d'Ivoire", nl: "Ivoorkust", fr: "Côte d'Ivoire", de: "Elfenbeinküste", es: "Costa de Marfil", pt: "Costa do Marfim", it: "Costa d'Avorio", ar: "ساحل العاج", ja: "コートジボワール", zh: "科特迪瓦" } },
  { code: "HR", flag: "HR", continent: "europe", names: { en: "Croatia", nl: "Kroatië", fr: "Croatie", de: "Kroatien", es: "Croacia", pt: "Croácia", it: "Croazia", ar: "كرواتيا", ja: "クロアチア", zh: "克罗地亚" } },
  { code: "CU", flag: "CU", continent: "americas", names: { en: "Cuba", nl: "Cuba", fr: "Cuba", de: "Kuba", es: "Cuba", pt: "Cuba", it: "Cuba", ar: "كوبا", ja: "キューバ", zh: "古巴" } },
  { code: "CW", flag: "CW", continent: "americas", names: { en: "Curaçao", nl: "Curaçao", fr: "Curaçao", de: "Curaçao", es: "Curazao", pt: "Curaçao", it: "Curaçao", ar: "كوراساو", ja: "キュラソー", zh: "库拉索" } },
  { code: "CY", flag: "CY", continent: "europe", names: { en: "Cyprus", nl: "Cyprus", fr: "Chypre", de: "Zypern", es: "Chipre", pt: "Chipre", it: "Cipro", ar: "قبرص", ja: "キプロス", zh: "塞浦路斯" } },
  { code: "CZ", flag: "CZ", continent: "europe", names: { en: "Czech Republic", nl: "Tsjechië", fr: "République tchèque", de: "Tschechien", es: "República Checa", pt: "República Checa", it: "Repubblica Ceca", ar: "جمهورية التشيك", ja: "チェコ", zh: "捷克" } },
  { code: "CD", flag: "CD", continent: "middle_east_africa", names: { en: "DR Congo", nl: "DR Congo", fr: "RD du Congo", de: "DR Kongo", es: "RD del Congo", pt: "RD do Congo", it: "RD del Congo", ar: "جمهورية الكونغو الديمقراطية", ja: "コンゴ民主共和国", zh: "刚果民主共和国" } },
  { code: "DK", flag: "DK", continent: "europe", names: { en: "Denmark", nl: "Denemarken", fr: "Danemark", de: "Dänemark", es: "Dinamarca", pt: "Dinamarca", it: "Danimarca", ar: "الدنمارك", ja: "デンマーク", zh: "丹麦" } },
  { code: "DJ", flag: "DJ", continent: "middle_east_africa", names: { en: "Djibouti", nl: "Djibouti", fr: "Djibouti", de: "Dschibuti", es: "Yibuti", pt: "Djibuti", it: "Gibuti", ar: "جيبوتي", ja: "ジブチ", zh: "吉布提" } },
  { code: "DM", flag: "DM", continent: "americas", names: { en: "Dominica", nl: "Dominica", fr: "Dominique", de: "Dominica", es: "Dominica", pt: "Dominica", it: "Dominica", ar: "دومينيكا", ja: "ドミニカ国", zh: "多米尼克" } },
  { code: "DO", flag: "DO", continent: "americas", names: { en: "Dominican Republic", nl: "Dominicaanse Republiek", fr: "République dominicaine", de: "Dominikanische Republik", es: "República Dominicana", pt: "República Dominicana", it: "Repubblica Dominicana", ar: "جمهورية الدومينيكان", ja: "ドミニカ共和国", zh: "多明尼加共和国" } },
  { code: "EC", flag: "EC", continent: "americas", names: { en: "Ecuador", nl: "Ecuador", fr: "Équateur", de: "Ecuador", es: "Ecuador", pt: "Equador", it: "Ecuador", ar: "الإكوادور", ja: "エクアドル", zh: "厄瓜多尔" } },
  { code: "EG", flag: "EG", continent: "middle_east_africa", names: { en: "Egypt", nl: "Egypte", fr: "Égypte", de: "Ägypten", es: "Egipto", pt: "Egito", it: "Egitto", ar: "مصر", ja: "エジプト", zh: "埃及" } },
  { code: "SV", flag: "SV", continent: "americas", names: { en: "El Salvador", nl: "El Salvador", fr: "El Salvador", de: "El Salvador", es: "El Salvador", pt: "El Salvador", it: "El Salvador", ar: "السلفادور", ja: "エルサルバドル", zh: "萨尔瓦多" } },
  { code: "GQ", flag: "GQ", continent: "middle_east_africa", names: { en: "Equatorial Guinea", nl: "Equatoriaal-Guinea", fr: "Guinée équatoriale", de: "Äquatorialguinea", es: "Guinea Ecuatorial", pt: "Guiné Equatorial", it: "Guinea Equatoriale", ar: "غينيا الاستوائية", ja: "赤道ギニア", zh: "赤道几内亚" } },
  { code: "ER", flag: "ER", continent: "middle_east_africa", names: { en: "Eritrea", nl: "Eritrea", fr: "Érythrée", de: "Eritrea", es: "Eritrea", pt: "Eritreia", it: "Eritrea", ar: "إريتريا", ja: "エリトリア", zh: "厄立特里亚" } },
  { code: "EE", flag: "EE", continent: "europe", names: { en: "Estonia", nl: "Estland", fr: "Estonie", de: "Estland", es: "Estonia", pt: "Estónia", it: "Estonia", ar: "إستونيا", ja: "エストニア", zh: "爱沙尼亚" } },
  { code: "SZ", flag: "SZ", continent: "middle_east_africa", names: { en: "Eswatini", nl: "Eswatini", fr: "Eswatini", de: "Eswatini", es: "Esuatini", pt: "Essuatíni", it: "Eswatini", ar: "إسواتيني", ja: "エスワティニ", zh: "斯威士兰" } },
  { code: "ET", flag: "ET", continent: "middle_east_africa", names: { en: "Ethiopia", nl: "Ethiopië", fr: "Éthiopie", de: "Äthiopien", es: "Etiopía", pt: "Etiópia", it: "Etiopia", ar: "إثيوبيا", ja: "エチオピア", zh: "埃塞俄比亚" } },
  { code: "FO", flag: "FO", continent: "europe", names: { en: "Faroe Islands", nl: "Faeröer", fr: "Îles Féroé", de: "Färöer", es: "Islas Feroe", pt: "Ilhas Faroé", it: "Isole Faroe", ar: "جزر فارو", ja: "フェロー諸島", zh: "法罗群岛" } },
  { code: "FM", flag: "FM", continent: "asia_pacific", names: { en: "Micronesia", nl: "Micronesië", fr: "Micronésie", de: "Mikronesien", es: "Micronesia", pt: "Micronésia", it: "Micronesia", ar: "ميكرونيزيا", ja: "ミクロネシア", zh: "密克罗尼西亚" } },
  { code: "FJ", flag: "FJ", continent: "asia_pacific", names: { en: "Fiji", nl: "Fiji", fr: "Fidji", de: "Fidschi", es: "Fiyi", pt: "Fiji", it: "Figi", ar: "فيجي", ja: "フィジー", zh: "斐济" } },
  { code: "FI", flag: "FI", continent: "europe", names: { en: "Finland", nl: "Finland", fr: "Finlande", de: "Finnland", es: "Finlandia", pt: "Finlândia", it: "Finlandia", ar: "فنلندا", ja: "フィンランド", zh: "芬兰" } },
  { code: "PF", flag: "PF", continent: "asia_pacific", names: { en: "French Polynesia", nl: "Frans-Polynesië", fr: "Polynésie française", de: "Französisch-Polynesien", es: "Polinesia Francesa", pt: "Polinésia Francesa", it: "Polinesia Francese", ar: "بولينيزيا الفرنسية", ja: "フランス領ポリネシア", zh: "法属波利尼西亚" } },
  { code: "GA", flag: "GA", continent: "middle_east_africa", names: { en: "Gabon", nl: "Gabon", fr: "Gabon", de: "Gabun", es: "Gabón", pt: "Gabão", it: "Gabon", ar: "الغابون", ja: "ガボン", zh: "加蓬" } },
  { code: "GM", flag: "GM", continent: "middle_east_africa", names: { en: "Gambia", nl: "Gambia", fr: "Gambie", de: "Gambia", es: "Gambia", pt: "Gâmbia", it: "Gambia", ar: "غامبيا", ja: "ガンビア", zh: "冈比亚" } },
  { code: "GH", flag: "GH", continent: "middle_east_africa", names: { en: "Ghana", nl: "Ghana", fr: "Ghana", de: "Ghana", es: "Ghana", pt: "Gana", it: "Ghana", ar: "غانا", ja: "ガーナ", zh: "加纳" } },
  { code: "GR", flag: "GR", continent: "europe", names: { en: "Greece", nl: "Griekenland", fr: "Grèce", de: "Griechenland", es: "Grecia", pt: "Grécia", it: "Grecia", ar: "اليونان", ja: "ギリシャ", zh: "希腊" } },
  { code: "GL", flag: "GL", continent: "europe", names: { en: "Greenland", nl: "Groenland", fr: "Groenland", de: "Grönland", es: "Groenlandia", pt: "Gronelândia", it: "Groenlandia", ar: "غرينلاند", ja: "グリーンランド", zh: "格陵兰" } },
  { code: "GD", flag: "GD", continent: "americas", names: { en: "Grenada", nl: "Grenada", fr: "Grenade", de: "Grenada", es: "Granada", pt: "Granada", it: "Grenada", ar: "غرينادا", ja: "グレナダ", zh: "格林纳达" } },
  { code: "GT", flag: "GT", continent: "americas", names: { en: "Guatemala", nl: "Guatemala", fr: "Guatemala", de: "Guatemala", es: "Guatemala", pt: "Guatemala", it: "Guatemala", ar: "غواتيمالا", ja: "グアテマラ", zh: "危地马拉" } },
  { code: "GN", flag: "GN", continent: "middle_east_africa", names: { en: "Guinea", nl: "Guinee", fr: "Guinée", de: "Guinea", es: "Guinea", pt: "Guiné", it: "Guinea", ar: "غينيا", ja: "ギニア", zh: "几内亚" } },
  { code: "GW", flag: "GW", continent: "middle_east_africa", names: { en: "Guinea-Bissau", nl: "Guinee-Bissau", fr: "Guinée-Bissau", de: "Guinea-Bissau", es: "Guinea-Bisáu", pt: "Guiné-Bissau", it: "Guinea-Bissau", ar: "غينيا بيساو", ja: "ギニアビサウ", zh: "几内亚比绍" } },
  { code: "GY", flag: "GY", continent: "americas", names: { en: "Guyana", nl: "Guyana", fr: "Guyana", de: "Guyana", es: "Guyana", pt: "Guiana", it: "Guyana", ar: "غيانا", ja: "ガイアナ", zh: "圭亚那" } },
  { code: "HT", flag: "HT", continent: "americas", names: { en: "Haiti", nl: "Haïti", fr: "Haïti", de: "Haiti", es: "Haití", pt: "Haiti", it: "Haiti", ar: "هايتي", ja: "ハイチ", zh: "海地" } },
  { code: "HN", flag: "HN", continent: "americas", names: { en: "Honduras", nl: "Honduras", fr: "Honduras", de: "Honduras", es: "Honduras", pt: "Honduras", it: "Honduras", ar: "هندوراس", ja: "ホンジュラス", zh: "洪都拉斯" } },
  { code: "HK", flag: "HK", continent: "asia_pacific", names: { en: "Hong Kong", nl: "Hongkong", fr: "Hong Kong", de: "Hongkong", es: "Hong Kong", pt: "Hong Kong", it: "Hong Kong", ar: "هونج كونج", ja: "香港", zh: "香港" } },
  { code: "HU", flag: "HU", continent: "europe", names: { en: "Hungary", nl: "Hongarije", fr: "Hongrie", de: "Ungarn", es: "Hungría", pt: "Hungria", it: "Ungheria", ar: "المجر", ja: "ハンガリー", zh: "匈牙利" } },
  { code: "IS", flag: "IS", continent: "europe", names: { en: "Iceland", nl: "IJsland", fr: "Islande", de: "Island", es: "Islandia", pt: "Islândia", it: "Islanda", ar: "آيسلندا", ja: "アイスランド", zh: "冰岛" } },
  { code: "ID", flag: "ID", continent: "asia_pacific", names: { en: "Indonesia", nl: "Indonesië", fr: "Indonésie", de: "Indonesien", es: "Indonesia", pt: "Indonésia", it: "Indonesia", ar: "إندونيسيا", ja: "インドネシア", zh: "印度尼西亚" } },
  { code: "IR", flag: "IR", continent: "middle_east_africa", names: { en: "Iran", nl: "Iran", fr: "Iran", de: "Iran", es: "Irán", pt: "Irã", it: "Iran", ar: "إيران", ja: "イラン", zh: "伊朗" } },
  { code: "IQ", flag: "IQ", continent: "middle_east_africa", names: { en: "Iraq", nl: "Irak", fr: "Irak", de: "Irak", es: "Irak", pt: "Iraque", it: "Iraq", ar: "العراق", ja: "イラク", zh: "伊拉克" } },
  { code: "IE", flag: "IE", continent: "europe", names: { en: "Ireland", nl: "Ierland", fr: "Irlande", de: "Irland", es: "Irlanda", pt: "Irlanda", it: "Irlanda", ar: "أيرلندا", ja: "アイルランド", zh: "爱尔兰" } },
  { code: "IL", flag: "IL", continent: "middle_east_africa", names: { en: "Israel", nl: "Israël", fr: "Israël", de: "Israel", es: "Israel", pt: "Israel", it: "Israele", ar: "إسرائيل", ja: "イスラエル", zh: "以色列" } },
  { code: "JM", flag: "JM", continent: "americas", names: { en: "Jamaica", nl: "Jamaica", fr: "Jamaïque", de: "Jamaika", es: "Jamaica", pt: "Jamaica", it: "Giamaica", ar: "جامايكا", ja: "ジャマイカ", zh: "牙买加" } },
  { code: "JO", flag: "JO", continent: "middle_east_africa", names: { en: "Jordan", nl: "Jordanië", fr: "Jordanie", de: "Jordanien", es: "Jordania", pt: "Jordânia", it: "Giordania", ar: "الأردن", ja: "ヨルダン", zh: "约旦" } },
  { code: "KZ", flag: "KZ", continent: "asia_pacific", names: { en: "Kazakhstan", nl: "Kazachstan", fr: "Kazakhstan", de: "Kasachstan", es: "Kazajistán", pt: "Cazaquistão", it: "Kazakistan", ar: "كازاخستان", ja: "カザフスタン", zh: "哈萨克斯坦" } },
  { code: "KE", flag: "KE", continent: "middle_east_africa", names: { en: "Kenya", nl: "Kenia", fr: "Kenya", de: "Kenia", es: "Kenia", pt: "Quénia", it: "Kenya", ar: "كينيا", ja: "ケニア", zh: "肯尼亚" } },
  { code: "KI", flag: "KI", continent: "asia_pacific", names: { en: "Kiribati", nl: "Kiribati", fr: "Kiribati", de: "Kiribati", es: "Kiribati", pt: "Kiribati", it: "Kiribati", ar: "كيريباتي", ja: "キリバス", zh: "基里巴斯" } },
  { code: "XK", flag: "XK", continent: "europe", names: { en: "Kosovo", nl: "Kosovo", fr: "Kosovo", de: "Kosovo", es: "Kosovo", pt: "Kosovo", it: "Kosovo", ar: "كوسوفو", ja: "コソボ", zh: "科索沃" } },
  { code: "KW", flag: "KW", continent: "middle_east_africa", names: { en: "Kuwait", nl: "Koeweit", fr: "Koweït", de: "Kuwait", es: "Kuwait", pt: "Kuwait", it: "Kuwait", ar: "الكويت", ja: "クウェート", zh: "科威特" } },
  { code: "KG", flag: "KG", continent: "asia_pacific", names: { en: "Kyrgyzstan", nl: "Kirgizstan", fr: "Kirghizistan", de: "Kirgisistan", es: "Kirguistán", pt: "Quirguistão", it: "Kirghizistan", ar: "قيرغيزستان", ja: "キルギスタン", zh: "吉尔吉斯斯坦" } },
  { code: "LA", flag: "LA", continent: "asia_pacific", names: { en: "Laos", nl: "Laos", fr: "Laos", de: "Laos", es: "Laos", pt: "Laos", it: "Laos", ar: "لاوس", ja: "ラオス", zh: "老挝" } },
  { code: "LV", flag: "LV", continent: "europe", names: { en: "Latvia", nl: "Letland", fr: "Lettonie", de: "Lettland", es: "Letonia", pt: "Letônia", it: "Lettonia", ar: "لاتفيا", ja: "ラトビア", zh: "拉脱维亚" } },
  { code: "LB", flag: "LB", continent: "middle_east_africa", names: { en: "Lebanon", nl: "Libanon", fr: "Liban", de: "Libanon", es: "Líbano", pt: "Líbano", it: "Libano", ar: "لبنان", ja: "レバノン", zh: "黎巴嫩" } },
  { code: "LS", flag: "LS", continent: "middle_east_africa", names: { en: "Lesotho", nl: "Lesotho", fr: "Lesotho", de: "Lesotho", es: "Lesoto", pt: "Lesoto", it: "Lesotho", ar: "ليسوتو", ja: "レソト", zh: "莱索托" } },
  { code: "LR", flag: "LR", continent: "middle_east_africa", names: { en: "Liberia", nl: "Liberia", fr: "Liberia", de: "Liberia", es: "Liberia", pt: "Libéria", it: "Liberia", ar: "ليبيريا", ja: "リベリア", zh: "利比里亚" } },
  { code: "LY", flag: "LY", continent: "middle_east_africa", names: { en: "Libya", nl: "Libië", fr: "Libye", de: "Libyen", es: "Libia", pt: "Líbia", it: "Libia", ar: "ليبيا", ja: "リビア", zh: "利比亚" } },
  { code: "LI", flag: "LI", continent: "europe", names: { en: "Liechtenstein", nl: "Liechtenstein", fr: "Liechtenstein", de: "Liechtenstein", es: "Liechtenstein", pt: "Liechtenstein", it: "Liechtenstein", ar: "ليختنشتاين", ja: "リヒテンシュタイン", zh: "列支敦士登" } },
  { code: "LT", flag: "LT", continent: "europe", names: { en: "Lithuania", nl: "Litouwen", fr: "Lituanie", de: "Litauen", es: "Lituania", pt: "Lituânia", it: "Lituania", ar: "ليتوانيا", ja: "リトアニア", zh: "立陶宛" } },
  { code: "LU", flag: "LU", continent: "europe", names: { en: "Luxembourg", nl: "Luxemburg", fr: "Luxembourg", de: "Luxemburg", es: "Luxemburgo", pt: "Luxemburgo", it: "Lussemburgo", ar: "لوكسمبورغ", ja: "ルクセンブルク", zh: "卢森堡" } },
  { code: "MO", flag: "MO", continent: "asia_pacific", names: { en: "Macau", nl: "Macau", fr: "Macao", de: "Macau", es: "Macao", pt: "Macau", it: "Macau", ar: "ماكاو", ja: "マカオ", zh: "澳门" } },
  { code: "MG", flag: "MG", continent: "middle_east_africa", names: { en: "Madagascar", nl: "Madagaskar", fr: "Madagascar", de: "Madagaskar", es: "Madagascar", pt: "Madagáscar", it: "Madagascar", ar: "مدغشقر", ja: "マダガスカル", zh: "马达加斯加" } },
  { code: "MW", flag: "MW", continent: "middle_east_africa", names: { en: "Malawi", nl: "Malawi", fr: "Malawi", de: "Malawi", es: "Malaui", pt: "Malawi", it: "Malawi", ar: "ملاوي", ja: "マラウイ", zh: "马拉维" } },
  { code: "MY", flag: "MY", continent: "asia_pacific", names: { en: "Malaysia", nl: "Maleisië", fr: "Malaisie", de: "Malaysia", es: "Malasia", pt: "Malásia", it: "Malaysia", ar: "ماليزيا", ja: "マレーシア", zh: "马来西亚" } },
  { code: "MV", flag: "MV", continent: "asia_pacific", names: { en: "Maldives", nl: "Malediven", fr: "Maldives", de: "Malediven", es: "Maldivas", pt: "Maldivas", it: "Maldive", ar: "المالديف", ja: "モルディブ", zh: "马尔代夫" } },
  { code: "ML", flag: "ML", continent: "middle_east_africa", names: { en: "Mali", nl: "Mali", fr: "Mali", de: "Mali", es: "Malí", pt: "Mali", it: "Mali", ar: "مالي", ja: "マリ", zh: "马里" } },
  { code: "MT", flag: "MT", continent: "europe", names: { en: "Malta", nl: "Malta", fr: "Malte", de: "Malta", es: "Malta", pt: "Malta", it: "Malta", ar: "مالطا", ja: "マルタ", zh: "马耳他" } },
  { code: "MH", flag: "MH", continent: "asia_pacific", names: { en: "Marshall Islands", nl: "Marshalleilanden", fr: "Îles Marshall", de: "Marshallinseln", es: "Islas Marshall", pt: "Ilhas Marshall", it: "Isole Marshall", ar: "جزر مارشال", ja: "マーシャル諸島", zh: "马绍尔群岛" } },
  { code: "MR", flag: "MR", continent: "middle_east_africa", names: { en: "Mauritania", nl: "Mauritanië", fr: "Mauritanie", de: "Mauretanien", es: "Mauritania", pt: "Mauritânia", it: "Mauritania", ar: "موريتانيا", ja: "モーリタニア", zh: "毛里塔尼亚" } },
  { code: "MU", flag: "MU", continent: "middle_east_africa", names: { en: "Mauritius", nl: "Mauritius", fr: "Maurice", de: "Mauritius", es: "Mauricio", pt: "Maurícia", it: "Mauritius", ar: "موريشيوس", ja: "モーリシャス", zh: "毛里求斯" } },
  { code: "MD", flag: "MD", continent: "europe", names: { en: "Moldova", nl: "Moldavië", fr: "Moldavie", de: "Moldau", es: "Moldavia", pt: "Moldávia", it: "Moldavia", ar: "مولدوفا", ja: "モルドバ", zh: "摩尔多瓦" } },
  { code: "MC", flag: "MC", continent: "europe", names: { en: "Monaco", nl: "Monaco", fr: "Monaco", de: "Monaco", es: "Mónaco", pt: "Mónaco", it: "Monaco", ar: "موناكو", ja: "モナコ", zh: "摩纳哥" } },
  { code: "MN", flag: "MN", continent: "asia_pacific", names: { en: "Mongolia", nl: "Mongolië", fr: "Mongolie", de: "Mongolei", es: "Mongolia", pt: "Mongólia", it: "Mongolia", ar: "منغوليا", ja: "モンゴル", zh: "蒙古" } },
  { code: "ME", flag: "ME", continent: "europe", names: { en: "Montenegro", nl: "Montenegro", fr: "Monténégro", de: "Montenegro", es: "Montenegro", pt: "Montenegro", it: "Montenegro", ar: "الجبل الأسود", ja: "モンテネグロ", zh: "黑山" } },
  { code: "MA", flag: "MA", continent: "middle_east_africa", names: { en: "Morocco", nl: "Marokko", fr: "Maroc", de: "Marokko", es: "Marruecos", pt: "Marrocos", it: "Marocco", ar: "المغرب", ja: "モロッコ", zh: "摩洛哥" } },
  { code: "MZ", flag: "MZ", continent: "middle_east_africa", names: { en: "Mozambique", nl: "Mozambique", fr: "Mozambique", de: "Mosambik", es: "Mozambique", pt: "Moçambique", it: "Mozambico", ar: "موزمبيق", ja: "モザンビーク", zh: "莫桑比克" } },
  { code: "MM", flag: "MM", continent: "asia_pacific", names: { en: "Myanmar", nl: "Myanmar", fr: "Myanmar", de: "Myanmar", es: "Birmania", pt: "Mianmar", it: "Myanmar", ar: "ميانمار", ja: "ミャンマー", zh: "缅甸" } },
  { code: "NA", flag: "NA", continent: "middle_east_africa", names: { en: "Namibia", nl: "Namibië", fr: "Namibie", de: "Namibia", es: "Namibia", pt: "Namíbia", it: "Namibia", ar: "ناميبيا", ja: "ナミビア", zh: "纳米比亚" } },
  { code: "NR", flag: "NR", continent: "asia_pacific", names: { en: "Nauru", nl: "Nauru", fr: "Nauru", de: "Nauru", es: "Nauru", pt: "Nauru", it: "Nauru", ar: "ناورو", ja: "ナウル", zh: "瑙鲁" } },
  { code: "NP", flag: "NP", continent: "asia_pacific", names: { en: "Nepal", nl: "Nepal", fr: "Népal", de: "Nepal", es: "Nepal", pt: "Nepal", it: "Nepal", ar: "نيبال", ja: "ネパール", zh: "尼泊尔" } },
  { code: "NZ", flag: "NZ", continent: "asia_pacific", names: { en: "New Zealand", nl: "Nieuw-Zeeland", fr: "Nouvelle-Zélande", de: "Neuseeland", es: "Nueva Zelanda", pt: "Nova Zelândia", it: "Nuova Zelanda", ar: "نيوزيلندا", ja: "ニュージーランド", zh: "新西兰" } },
  { code: "NI", flag: "NI", continent: "americas", names: { en: "Nicaragua", nl: "Nicaragua", fr: "Nicaragua", de: "Nicaragua", es: "Nicaragua", pt: "Nicarágua", it: "Nicaragua", ar: "نيكاراغوا", ja: "ニカラグア", zh: "尼加拉瓜" } },
  { code: "NE", flag: "NE", continent: "middle_east_africa", names: { en: "Niger", nl: "Niger", fr: "Niger", de: "Niger", es: "Níger", pt: "Níger", it: "Niger", ar: "النيجر", ja: "ニジェール", zh: "尼日尔" } },
  { code: "NG", flag: "NG", continent: "middle_east_africa", names: { en: "Nigeria", nl: "Nigeria", fr: "Nigéria", de: "Nigeria", es: "Nigeria", pt: "Nigéria", it: "Nigeria", ar: "نيجيريا", ja: "ナイジェリア", zh: "尼日利亚" } },
  { code: "NU", flag: "NU", continent: "asia_pacific", names: { en: "Niue", nl: "Niue", fr: "Niué", de: "Niue", es: "Niue", pt: "Niue", it: "Niue", ar: "نيوي", ja: "ニウエ", zh: "纽埃" } },
  { code: "KP", flag: "KP", continent: "asia_pacific", names: { en: "North Korea", nl: "Noord-Korea", fr: "Corée du Nord", de: "Nordkorea", es: "Corea del Norte", pt: "Coreia do Norte", it: "Corea del Nord", ar: "كوريا الشمالية", ja: "北朝鮮", zh: "朝鲜" } },
  { code: "MK", flag: "MK", continent: "europe", names: { en: "North Macedonia", nl: "Noord-Macedonië", fr: "Macédoine du Nord", de: "Nordmazedonien", es: "Macedonia del Norte", pt: "Macedónia do Norte", it: "Macedonia del Nord", ar: "مقدونيا الشمالية", ja: "北マケドニア", zh: "北马其顿" } },
  { code: "NO", flag: "NO", continent: "europe", names: { en: "Norway", nl: "Noorwegen", fr: "Norvège", de: "Norwegen", es: "Noruega", pt: "Noruega", it: "Norvegia", ar: "النرويج", ja: "ノルウェー", zh: "挪威" } },
  { code: "OM", flag: "OM", continent: "middle_east_africa", names: { en: "Oman", nl: "Oman", fr: "Oman", de: "Oman", es: "Omán", pt: "Omã", it: "Oman", ar: "عُمان", ja: "オマーン", zh: "阿曼" } },
  { code: "PK", flag: "PK", continent: "asia_pacific", names: { en: "Pakistan", nl: "Pakistan", fr: "Pakistan", de: "Pakistan", es: "Pakistán", pt: "Paquistão", it: "Pakistan", ar: "باكستان", ja: "パキスタン", zh: "巴基斯坦" } },
  { code: "PW", flag: "PW", continent: "asia_pacific", names: { en: "Palau", nl: "Palau", fr: "Palaos", de: "Palau", es: "Palaos", pt: "Palau", it: "Palau", ar: "بالاو", ja: "パラオ", zh: "帕劳" } },
  { code: "PS", flag: "PS", continent: "middle_east_africa", names: { en: "Palestine", nl: "Palestina", fr: "Palestine", de: "Palästina", es: "Palestina", pt: "Palestina", it: "Palestina", ar: "فلسطين", ja: "パレスチナ", zh: "巴勒斯坦" } },
  { code: "PA", flag: "PA", continent: "americas", names: { en: "Panama", nl: "Panama", fr: "Panama", de: "Panama", es: "Panamá", pt: "Panamá", it: "Panama", ar: "بنما", ja: "パナマ", zh: "巴拿马" } },
  { code: "PG", flag: "PG", continent: "asia_pacific", names: { en: "Papua New Guinea", nl: "Papoea-Nieuw-Guinea", fr: "Papouasie-Nouvelle-Guinée", de: "Papua-Neuguinea", es: "Papúa Nueva Guinea", pt: "Papua-Nova Guiné", it: "Papua Nuova Guinea", ar: "بابوا غينيا الجديدة", ja: "パプアニューギニア", zh: "巴布亚新几内亚" } },
  { code: "PY", flag: "PY", continent: "americas", names: { en: "Paraguay", nl: "Paraguay", fr: "Paraguay", de: "Paraguay", es: "Paraguay", pt: "Paraguai", it: "Paraguay", ar: "باراغواي", ja: "パラグアイ", zh: "巴拉圭" } },
  { code: "PE", flag: "PE", continent: "americas", names: { en: "Peru", nl: "Peru", fr: "Pérou", de: "Peru", es: "Perú", pt: "Peru", it: "Perù", ar: "بيرو", ja: "ペルー", zh: "秘鲁" } },
  { code: "PH", flag: "PH", continent: "asia_pacific", names: { en: "Philippines", nl: "Filipijnen", fr: "Philippines", de: "Philippinen", es: "Filipinas", pt: "Filipinas", it: "Filippine", ar: "الفلبين", ja: "フィリピン", zh: "菲律宾" } },
  { code: "PL", flag: "PL", continent: "europe", names: { en: "Poland", nl: "Polen", fr: "Pologne", de: "Polen", es: "Polonia", pt: "Polónia", it: "Polonia", ar: "بولندا", ja: "ポーランド", zh: "波兰" } },
  { code: "QA", flag: "QA", continent: "middle_east_africa", names: { en: "Qatar", nl: "Qatar", fr: "Qatar", de: "Katar", es: "Catar", pt: "Qatar", it: "Qatar", ar: "قطر", ja: "カタール", zh: "卡塔尔" } },
  { code: "CG", flag: "CG", continent: "middle_east_africa", names: { en: "Republic of Congo", nl: "Republiek Congo", fr: "République du Congo", de: "Republik Kongo", es: "República del Congo", pt: "República do Congo", it: "Repubblica del Congo", ar: "جمهورية الكونغو", ja: "コンゴ共和国", zh: "刚果共和国" } },
  { code: "RO", flag: "RO", continent: "europe", names: { en: "Romania", nl: "Roemenië", fr: "Roumanie", de: "Rumänien", es: "Rumanía", pt: "Roménia", it: "Romania", ar: "رومانيا", ja: "ルーマニア", zh: "罗马尼亚" } },
  { code: "RU", flag: "RU", continent: "europe", names: { en: "Russia", nl: "Rusland", fr: "Russie", de: "Russland", es: "Rusia", pt: "Rússia", it: "Russia", ar: "روسيا", ja: "ロシア", zh: "俄罗斯" } },
  { code: "RW", flag: "RW", continent: "middle_east_africa", names: { en: "Rwanda", nl: "Rwanda", fr: "Rwanda", de: "Ruanda", es: "Ruanda", pt: "Ruanda", it: "Ruanda", ar: "رواندا", ja: "ルワンダ", zh: "卢旺达" } },
  { code: "BL", flag: "BL", continent: "americas", names: { en: "Saint-Barthélemy", nl: "Saint-Barthélemy", fr: "Saint-Barthélemy", de: "Saint-Barthélemy", es: "San Bartolomé", pt: "São Bartolomeu", it: "Saint-Barthélemy", ar: "سانت بارتيلمي", ja: "サン・バルテルミー", zh: "圣巴泰勒米" } },
  { code: "KN", flag: "KN", continent: "americas", names: { en: "Saint Kitts and Nevis", nl: "Saint Kitts en Nevis", fr: "Saint-Kitts-et-Nevis", de: "St. Kitts und Nevis", es: "San Cristóbal y Nieves", pt: "São Cristóvão e Nevis", it: "Saint Kitts e Nevis", ar: "سانت كيتس ونيفيس", ja: "セントキッツ・ネービス", zh: "圣基茨和尼维斯" } },
  { code: "LC", flag: "LC", continent: "americas", names: { en: "Saint Lucia", nl: "Saint Lucia", fr: "Sainte-Lucie", de: "St. Lucia", es: "Santa Lucía", pt: "Santa Lúcia", it: "Santa Lucia", ar: "سانت لوسيا", ja: "セントルシア", zh: "圣卢西亚" } },
  { code: "VC", flag: "VC", continent: "americas", names: { en: "Saint Vincent and Grenadines", nl: "Saint Vincent en de Grenadines", fr: "Saint-Vincent-et-les-Grenadines", de: "St. Vincent und die Grenadinen", es: "San Vicente y Granadinas", pt: "São Vicente e Granadinas", it: "Saint Vincent e Grenadine", ar: "سانت فنسنت وجزر غرينادين", ja: "セントビンセント・グレナディーン", zh: "圣文森特和格林纳丁斯" } },
  { code: "WS", flag: "WS", continent: "asia_pacific", names: { en: "Samoa", nl: "Samoa", fr: "Samoa", de: "Samoa", es: "Samoa", pt: "Samoa", it: "Samoa", ar: "ساموا", ja: "サモア", zh: "萨摩亚" } },
  { code: "SM", flag: "SM", continent: "europe", names: { en: "San Marino", nl: "San Marino", fr: "Saint-Marin", de: "San Marino", es: "San Marino", pt: "San Marino", it: "San Marino", ar: "سان مارينو", ja: "サンマリノ", zh: "圣马力诺" } },
  { code: "ST", flag: "ST", continent: "middle_east_africa", names: { en: "São Tomé and Príncipe", nl: "Sao Tomé en Principe", fr: "Sao Tomé-et-Príncipe", de: "São Tomé und Príncipe", es: "Santo Tomé y Príncipe", pt: "São Tomé e Príncipe", it: "São Tomé e Príncipe", ar: "ساو تومي وبرينسيبي", ja: "サントメ・プリンシペ", zh: "圣多美和普林西比" } },
  { code: "SA", flag: "SA", continent: "middle_east_africa", names: { en: "Saudi Arabia", nl: "Saoedi-Arabië", fr: "Arabie saoudite", de: "Saudi-Arabien", es: "Arabia Saudita", pt: "Arábia Saudita", it: "Arabia Saudita", ar: "المملكة العربية السعودية", ja: "サウジアラビア", zh: "沙特阿拉伯" } },
  { code: "SN", flag: "SN", continent: "middle_east_africa", names: { en: "Senegal", nl: "Senegal", fr: "Sénégal", de: "Senegal", es: "Senegal", pt: "Senegal", it: "Senegal", ar: "السنغال", ja: "セネガル", zh: "塞内加尔" } },
  { code: "RS", flag: "RS", continent: "europe", names: { en: "Serbia", nl: "Servië", fr: "Serbie", de: "Serbien", es: "Serbia", pt: "Sérvia", it: "Serbia", ar: "صربيا", ja: "セルビア", zh: "塞尔维亚" } },
  { code: "SL", flag: "SL", continent: "middle_east_africa", names: { en: "Sierra Leone", nl: "Sierra Leone", fr: "Sierra Leone", de: "Sierra Leone", es: "Sierra Leona", pt: "Serra Leoa", it: "Sierra Leone", ar: "سيراليون", ja: "シエラレオネ", zh: "塞拉利昂" } },
  { code: "SK", flag: "SK", continent: "europe", names: { en: "Slovakia", nl: "Slowakije", fr: "Slovaquie", de: "Slowakei", es: "Eslovaquia", pt: "Eslováquia", it: "Slovacchia", ar: "سلوفاكيا", ja: "スロバキア", zh: "斯洛伐克" } },
  { code: "SI", flag: "SI", continent: "europe", names: { en: "Slovenia", nl: "Slovenië", fr: "Slovénie", de: "Slowenien", es: "Eslovenia", pt: "Eslovénia", it: "Slovenia", ar: "سلوفينيا", ja: "スロベニア", zh: "斯洛文尼亚" } },
  { code: "SB", flag: "SB", continent: "asia_pacific", names: { en: "Solomon Islands", nl: "Salomonseilanden", fr: "Îles Salomon", de: "Salomonen", es: "Islas Salomón", pt: "Ilhas Salomão", it: "Isole Salomone", ar: "جزر سليمان", ja: "ソロモン諸島", zh: "所罗门群岛" } },
  { code: "SO", flag: "SO", continent: "middle_east_africa", names: { en: "Somalia", nl: "Somalië", fr: "Somalie", de: "Somalia", es: "Somalia", pt: "Somália", it: "Somalia", ar: "الصومال", ja: "ソマリア", zh: "索马里" } },
  { code: "KR", flag: "KR", continent: "asia_pacific", names: { en: "South Korea", nl: "Zuid-Korea", fr: "Corée du Sud", de: "Südkorea", es: "Corea del Sur", pt: "Coreia do Sul", it: "Corea del Sud", ar: "كوريا الجنوبية", ja: "韓国", zh: "韩国" } },
  { code: "SS", flag: "SS", continent: "middle_east_africa", names: { en: "South Sudan", nl: "Zuid-Soedan", fr: "Soudan du Sud", de: "Südsudan", es: "Sudán del Sur", pt: "Sudão do Sul", it: "Sudan del Sud", ar: "جنوب السودان", ja: "南スーダン", zh: "南苏丹" } },
  { code: "LK", flag: "LK", continent: "asia_pacific", names: { en: "Sri Lanka", nl: "Sri Lanka", fr: "Sri Lanka", de: "Sri Lanka", es: "Sri Lanka", pt: "Sri Lanka", it: "Sri Lanka", ar: "سريلانكا", ja: "スリランカ", zh: "斯里兰卡" } },
  { code: "SD", flag: "SD", continent: "middle_east_africa", names: { en: "Sudan", nl: "Soedan", fr: "Soudan", de: "Sudan", es: "Sudán", pt: "Sudão", it: "Sudan", ar: "السودان", ja: "スーダン", zh: "苏丹" } },
  { code: "SR", flag: "SR", continent: "americas", names: { en: "Suriname", nl: "Suriname", fr: "Suriname", de: "Surinam", es: "Surinam", pt: "Suriname", it: "Suriname", ar: "سورينام", ja: "スリナム", zh: "苏里南" } },
  { code: "SE", flag: "SE", continent: "europe", names: { en: "Sweden", nl: "Zweden", fr: "Suède", de: "Schweden", es: "Suecia", pt: "Suécia", it: "Svezia", ar: "السويد", ja: "スウェーデン", zh: "瑞典" } },
  { code: "SY", flag: "SY", continent: "middle_east_africa", names: { en: "Syria", nl: "Syrië", fr: "Syrie", de: "Syrien", es: "Siria", pt: "Síria", it: "Siria", ar: "سوريا", ja: "シリア", zh: "叙利亚" } },
  { code: "TW", flag: "TW", continent: "asia_pacific", names: { en: "Taiwan", nl: "Taiwan", fr: "Taïwan", de: "Taiwan", es: "Taiwán", pt: "Taiwan", it: "Taiwan", ar: "تايوان", ja: "台湾", zh: "台湾" } },
  { code: "TJ", flag: "TJ", continent: "asia_pacific", names: { en: "Tajikistan", nl: "Tadzjikistan", fr: "Tadjikistan", de: "Tadschikistan", es: "Tayikistán", pt: "Tajiquistão", it: "Tagikistan", ar: "طاجيكستان", ja: "タジキスタン", zh: "塔吉克斯坦" } },
  { code: "TZ", flag: "TZ", continent: "middle_east_africa", names: { en: "Tanzania", nl: "Tanzania", fr: "Tanzanie", de: "Tansania", es: "Tanzania", pt: "Tanzânia", it: "Tanzania", ar: "تنزانيا", ja: "タンザニア", zh: "坦桑尼亚" } },
  { code: "TH", flag: "TH", continent: "asia_pacific", names: { en: "Thailand", nl: "Thailand", fr: "Thaïlande", de: "Thailand", es: "Tailandia", pt: "Tailândia", it: "Tailandia", ar: "تايلاند", ja: "タイ", zh: "泰国" } },
  { code: "TL", flag: "TL", continent: "asia_pacific", names: { en: "Timor-Leste", nl: "Oost-Timor", fr: "Timor oriental", de: "Osttimor", es: "Timor Oriental", pt: "Timor-Leste", it: "Timor Est", ar: "تيمور الشرقية", ja: "東ティモール", zh: "东帝汶" } },
  { code: "TG", flag: "TG", continent: "middle_east_africa", names: { en: "Togo", nl: "Togo", fr: "Togo", de: "Togo", es: "Togo", pt: "Togo", it: "Togo", ar: "توغو", ja: "トーゴ", zh: "多哥" } },
  { code: "TO", flag: "TO", continent: "asia_pacific", names: { en: "Tonga", nl: "Tonga", fr: "Tonga", de: "Tonga", es: "Tonga", pt: "Tonga", it: "Tonga", ar: "تونغا", ja: "トンガ", zh: "汤加" } },
  { code: "TT", flag: "TT", continent: "americas", names: { en: "Trinidad and Tobago", nl: "Trinidad en Tobago", fr: "Trinité-et-Tobago", de: "Trinidad und Tobago", es: "Trinidad y Tobago", pt: "Trinidad e Tobago", it: "Trinidad e Tobago", ar: "ترينيداد وتوباغو", ja: "トリニダード・トバゴ", zh: "特立尼达和多巴哥" } },
  { code: "TN", flag: "TN", continent: "middle_east_africa", names: { en: "Tunisia", nl: "Tunesië", fr: "Tunisie", de: "Tunesien", es: "Túnez", pt: "Tunísia", it: "Tunisia", ar: "تونس", ja: "チュニジア", zh: "突尼斯" } },
  { code: "TR", flag: "TR", continent: "europe", names: { en: "Türkiye", nl: "Turkije", fr: "Turquie", de: "Türkei", es: "Turquía", pt: "Turquia", it: "Turchia", ar: "تركيا", ja: "トルコ", zh: "土耳其" } },
  { code: "TM", flag: "TM", continent: "asia_pacific", names: { en: "Turkmenistan", nl: "Turkmenistan", fr: "Turkménistan", de: "Turkmenistan", es: "Turkmenistán", pt: "Turquemenistão", it: "Turkmenistan", ar: "تركمانستان", ja: "トルクメニスタン", zh: "土库曼斯坦" } },
  { code: "TC", flag: "TC", continent: "americas", names: { en: "Turks and Caicos", nl: "Turks- en Caicoseilanden", fr: "Îles Turques-et-Caïques", de: "Turks- und Caicosinseln", es: "Islas Turcas y Caicos", pt: "Ilhas Turcas e Caicos", it: "Turks e Caicos", ar: "جزر تركس وكايكوس", ja: "タークス・カイコス諸島", zh: "特克斯和凯科斯群岛" } },
  { code: "TV", flag: "TV", continent: "asia_pacific", names: { en: "Tuvalu", nl: "Tuvalu", fr: "Tuvalu", de: "Tuvalu", es: "Tuvalu", pt: "Tuvalu", it: "Tuvalu", ar: "توفالو", ja: "ツバル", zh: "图瓦卢" } },
  { code: "UG", flag: "UG", continent: "middle_east_africa", names: { en: "Uganda", nl: "Oeganda", fr: "Ouganda", de: "Uganda", es: "Uganda", pt: "Uganda", it: "Uganda", ar: "أوغندا", ja: "ウガンダ", zh: "乌干达" } },
  { code: "UA", flag: "UA", continent: "europe", names: { en: "Ukraine", nl: "Oekraïne", fr: "Ukraine", de: "Ukraine", es: "Ucrania", pt: "Ucrânia", it: "Ucraina", ar: "أوكرانيا", ja: "ウクライナ", zh: "乌克兰" } },
  { code: "UY", flag: "UY", continent: "americas", names: { en: "Uruguay", nl: "Uruguay", fr: "Uruguay", de: "Uruguay", es: "Uruguay", pt: "Uruguai", it: "Uruguay", ar: "أوروغواي", ja: "ウルグアイ", zh: "乌拉圭" } },
  { code: "UZ", flag: "UZ", continent: "asia_pacific", names: { en: "Uzbekistan", nl: "Oezbekistan", fr: "Ouzbékistan", de: "Usbekistan", es: "Uzbekistán", pt: "Uzbequistão", it: "Uzbekistan", ar: "أوزبكستان", ja: "ウズベキスタン", zh: "乌兹别克斯坦" } },
  { code: "VU", flag: "VU", continent: "asia_pacific", names: { en: "Vanuatu", nl: "Vanuatu", fr: "Vanuatu", de: "Vanuatu", es: "Vanuatu", pt: "Vanuatu", it: "Vanuatu", ar: "فانواتو", ja: "バヌアツ", zh: "瓦努阿图" } },
  { code: "VA", flag: "VA", continent: "europe", names: { en: "Vatican City", nl: "Vaticaanstad", fr: "Cité du Vatican", de: "Vatikanstadt", es: "Ciudad del Vaticano", pt: "Cidade do Vaticano", it: "Città del Vaticano", ar: "مدينة الفاتيكان", ja: "バチカン市国", zh: "梵蒂冈" } },
  { code: "VE", flag: "VE", continent: "americas", names: { en: "Venezuela", nl: "Venezuela", fr: "Venezuela", de: "Venezuela", es: "Venezuela", pt: "Venezuela", it: "Venezuela", ar: "فنزويلا", ja: "ベネズエラ", zh: "委内瑞拉" } },
  { code: "VN", flag: "VN", continent: "asia_pacific", names: { en: "Vietnam", nl: "Vietnam", fr: "Vietnam", de: "Vietnam", es: "Vietnam", pt: "Vietnã", it: "Vietnam", ar: "فيتنام", ja: "ベトナム", zh: "越南" } },
  { code: "YE", flag: "YE", continent: "middle_east_africa", names: { en: "Yemen", nl: "Jemen", fr: "Yémen", de: "Jemen", es: "Yemen", pt: "Iémen", it: "Yemen", ar: "اليمن", ja: "イエメン", zh: "也门" } },
  { code: "ZM", flag: "ZM", continent: "middle_east_africa", names: { en: "Zambia", nl: "Zambia", fr: "Zambie", de: "Sambia", es: "Zambia", pt: "Zâmbia", it: "Zambia", ar: "زامبيا", ja: "ザンビア", zh: "赞比亚" } },
  { code: "ZW", flag: "ZW", continent: "middle_east_africa", names: { en: "Zimbabwe", nl: "Zimbabwe", fr: "Zimbabwe", de: "Simbabwe", es: "Zimbabue", pt: "Zimbábue", it: "Zimbabwe", ar: "زيمبابوي", ja: "ジンバブエ", zh: "津巴布韦" } },
];

/**
 * Regions that currently have a baseline dataset across all three modules:
 * The Atelier (scenarios), The Cultural Compass, and The Counsel.
 * Update this set when new region data is seeded into the database.
 */
export const ACTIVE_REGIONS: ReadonlySet<RegionCode> = new Set([
  "GB", "AU", "CN", "US", "JP", "DE", "IT", "FR", "BE", "CH",
  "BR", "ES", "SG", "IN", "MX", "AE", "CO",
  "NL", "CA", "PT", "ZA",
]);

export function isRegionActive(code: RegionCode): boolean {
  return ACTIVE_REGIONS.has(code);
}

/** Persisted user preference — survives across sessions. */
const REGION_PREF_KEY = "sowiso_active_region";
/** Location-inferred suggestion — cleared when the browser tab closes. */
const REGION_SESSION_KEY = "sowiso_session_region";

const LANGUAGE_DEFAULTS: Record<SupportedLanguage, RegionCode> = {
  en: "GB",
  nl: "NL",
  fr: "FR",
  de: "DE",
  es: "ES",
  pt: "PT",
  it: "IT",
  ar: "AE",
  ja: "JP",
  zh: "CN",
};

function resolveActiveRegion(language: SupportedLanguage): RegionCode {
  const validCodes = COMPASS_REGIONS.map((r) => r.code);
  // Session-scoped location suggestion takes precedence over stored preference.
  const session = sessionStorage.getItem(REGION_SESSION_KEY) as RegionCode | null;
  if (session && validCodes.includes(session)) return session;
  const stored = localStorage.getItem(REGION_PREF_KEY) as RegionCode | null;
  if (stored && validCodes.includes(stored)) return stored;
  // Fall back to the language-appropriate default — all regions are selectable.
  return (LANGUAGE_DEFAULTS[language] ?? "GB") as RegionCode;
}

interface ActiveRegionContextValue {
  activeRegion: RegionCode;
  /** Persist the user's explicit region choice to localStorage. */
  setActiveRegion: (code: RegionCode) => void;
  /** Accept a location-detected suggestion; stored in sessionStorage only. */
  setDetectedRegion: (code: RegionCode) => void;
  getRegionName: (code: RegionCode) => string;
  getCurrentRegion: () => CompassRegion;
}

const ActiveRegionContext = createContext<ActiveRegionContextValue | null>(null);

export function ActiveRegionProvider({
  children,
  language,
}: {
  children: React.ReactNode;
  language: SupportedLanguage;
}) {
  const [activeRegion, setActiveRegionState] = useState<RegionCode>(() =>
    resolveActiveRegion(language)
  );

  // Hydrate active region from the user profile on first load if no explicit
  // preference is stored yet (localStorage key absent).
  useEffect(() => {
    if (localStorage.getItem(REGION_PREF_KEY)) return;
    const apiBase = (import.meta as { env?: { BASE_URL?: string } }).env?.BASE_URL?.replace(/\/$/, "") ?? "";
    fetch(`${apiBase}/api/users/profile`, {
      credentials: "include",
    })
      .then((r) => r.ok ? r.json() : null)
      .then((data: { active_region?: string } | null) => {
        if (!data?.active_region) return;
        const validCodes = COMPASS_REGIONS.map((r) => r.code);
        if (validCodes.includes(data.active_region as RegionCode)) {
          // Write to both state and localStorage so the preference persists
          // across page refreshes without requiring another profile API call.
          setActiveRegionState(data.active_region as RegionCode);
          localStorage.setItem(REGION_PREF_KEY, data.active_region);
        }
      })
      .catch(() => undefined);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setActiveRegion = useCallback((code: RegionCode) => {
    setActiveRegionState(code);
    localStorage.setItem(REGION_PREF_KEY, code);
    // Explicit user choice supersedes any session-scoped detection.
    sessionStorage.removeItem(REGION_SESSION_KEY);

    // Sync to profile API using the HttpOnly session cookie.
    // This ensures the active region is persisted globally (not just in localStorage)
    // regardless of which UI control triggered the change (context bar, profile page, etc.).
    const apiBase = (import.meta as { env?: { BASE_URL?: string } }).env?.BASE_URL?.replace(/\/$/, "") ?? "";
    fetch(`${apiBase}/api/users/profile/region`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ region_code: code }),
    }).catch(() => undefined); // Fire-and-forget; localStorage is the source of truth for UI
  }, []);

  const setDetectedRegion = useCallback((code: RegionCode) => {
    setActiveRegionState(code);
    sessionStorage.setItem(REGION_SESSION_KEY, code);
    // Do NOT write to localStorage — location data is session-scoped only.
  }, []);

  const getRegionName = useCallback(
    (code: RegionCode): string => {
      const region = COMPASS_REGIONS.find((r) => r.code === code);
      return region?.names[language] ?? code;
    },
    [language]
  );

  const getCurrentRegion = useCallback((): CompassRegion => {
    return COMPASS_REGIONS.find((r) => r.code === activeRegion) ?? COMPASS_REGIONS[0];
  }, [activeRegion]);

  return (
    <ActiveRegionContext.Provider
      value={{ activeRegion, setActiveRegion, setDetectedRegion, getRegionName, getCurrentRegion }}
    >
      {children}
    </ActiveRegionContext.Provider>
  );
}

export function useActiveRegion(): ActiveRegionContextValue {
  const ctx = useContext(ActiveRegionContext);
  if (!ctx) throw new Error("useActiveRegion must be used within ActiveRegionProvider");
  return ctx;
}

/**
 * Size variants for FlagEmoji.
 * sm — badge / pill contexts (text-sm)
 * md — inline / nav contexts (text-xl) — default
 * lg — card headers, capped so flags never overflow their card (text-2xl sm:text-3xl)
 */
export type FlagSize = "sm" | "md" | "lg";

const FLAG_SIZE_CLASSES: Record<FlagSize, string> = {
  sm: "text-sm leading-none",
  md: "text-xl leading-none",
  lg: "text-2xl sm:text-3xl leading-none",
};

/**
 * Renders a country flag using the bundled flag-icons CSS library.
 * No external CDN — SVGs are bundled locally with the app.
 * Use the `size` prop to control font-size; pass `className` only for
 * non-font-size utilities (opacity, drop-shadow, flex-shrink, etc.).
 */
export function FlagEmoji({
  code,
  size = "md",
  className,
  ariaLabel,
}: {
  code: string;
  size?: FlagSize;
  className?: string;
  ariaLabel?: string;
}) {
  const lower = code.toLowerCase().slice(0, 2);
  return (
    <span
      className={`fi fi-${lower} ${FLAG_SIZE_CLASSES[size]}${className ? ` ${className}` : ""}`}
      role="img"
      aria-label={ariaLabel ?? code.toUpperCase()}
    />
  );
}
