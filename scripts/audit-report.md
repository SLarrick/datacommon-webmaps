# DataCommon table audit (municipal + census tract)

Generated: 2026-07-19T02:21:55.610Z

- Municipal (`_m`): **137 of 168** eligible; 120 of those carry pre-computed subregion rows
- Census tract (`_ct`): **121 of 134** eligible
- Sibling pairs (same dataset at both levels): 105

## Ineligible tables by reason

### multiple rows per unit-year (max 4) — subgroup breakdowns not supported (11)

- `b01001a_whi_population_by_age_gender_acs_m`
- `b01001b_aa_population_by_age_gender_acs_m`
- `b01001c_na_population_by_age_gender_acs_m`
- `b01001d_as_population_by_age_gender_acs_m`
- `b01001e_pi_population_by_age_gender_acs_m`
- `b01001f_oth_population_by_age_gender_acs_m`
- `b01001g_mlt_population_by_age_gender_acs_m`
- `b01001h_nhw_population_by_age_gender_acs_m`
- `b01001i_lat_population_by_age_gender_acs_m`
- `demo_race_asian_detail_ct`
- `demo_race_latino_detail_ct`

### multiple rows per unit-year (max 2) — subgroup breakdowns not supported (10)

- `b08134_means_by_traveltime_to_work_acs_ct`
- `b18101_thru_b18107_disability_status_acs_ct`
- `b19001_hh_income_race_acs_m`
- `b19058_public_assist_acs_ct`
- `b19058_public_assist_acs_m`
- `b19083_gini_index_acs_ct`
- `b19083_gini_index_acs_m`
- `b25002_b25003_hu_occupancy_by_tenure_race_acs_ct`
- `b25063_b25064_b25065_rent_acs_m`
- `hous_hh_race_by_cb_chas_ct`

### multiple rows per unit-year (max 6) — subgroup breakdowns not supported (1)

- `b19037_hh_income_by_age_race_acs_m`

### stats query failed: API error: Unable to execute query (7)

- `creative_economy_m`
- `econ_es202_naics_2d_m`
- `econ_es202_naics_3d_m`
- `econ_es202_naics_4d_m`
- `internet_speed_test_m`
- `speculative_investment_m`
- `trans_mavc_fuel_mlg_co2_m`

### multiple rows per unit-year (max 9) — subgroup breakdowns not supported (2)

- `demo_general_demographics_ct`
- `demo_race_by_age_gender_m`

### multiple rows per unit-year (max 12303) — subgroup breakdowns not supported (1)

- `demo_race_by_age_gender_ct`

### multiple rows per unit-year (max 381) — subgroup breakdowns not supported (1)

- `econ_es202_all_m`

### multiple rows per unit (max 4) and no year column detected (1)

- `env_dep_reviewed_water_demand_m`

### multiple rows per unit-year (max 8) — subgroup breakdowns not supported (1)

- `ghg_mbta_freq_wt_trip_miles_m`

### multiple rows per unit-year (max 1366) — subgroup breakdowns not supported (1)

- `hmda_mortgage_denials_by_race_120k_ct`

### multiple rows per unit-year (max 1367) — subgroup breakdowns not supported (1)

- `hous_hh_type_size_by_seniors_ct`

### multiple rows per unit-year (max 11) — subgroup breakdowns not supported (2)

- `hous_res_sales_by_type_value_m`
- `hous_shi_m`

### multiple rows per unit (max 37) and no year column detected (1)

- `muni_finance_m`

### multiple rows per unit-year (max 33) — subgroup breakdowns not supported (1)

- `trans_mavc_public_summary_2020_m`

### multiple rows per unit (max 24) and no year column detected (2)

- `trans_mavc_public_summary_ct`
- `trans_mavc_public_summary_m`

### multiple rows per unit-year (max 13) — subgroup breakdowns not supported (1)

- `trans_mavc_public_summary_ghg_m`

## Eligible tables

- `b01001_population_by_age_gender_acs_ct` — Population by Age and Gender (382 vars, sibling: `b01001_population_by_age_gender_acs_m`)
- `b01001_population_by_age_gender_acs_m` — Population by Age and Gender (382 vars, subregion rows, sibling: `b01001_population_by_age_gender_acs_ct`)
- `b01001a_whi_population_by_age_gender_acs_ct` — White Alone Population by Age and Gender  (262 vars)
- `b01001b_aa_population_by_age_gender_acs_ct` — Black Or African American Alone Population by Age and Gender (262 vars)
- `b01001c_na_population_by_age_gender_acs_ct` — American Indian And Alaska Native Alone Population by Age and Gender (262 vars)
- `b01001d_as_population_by_age_gender_acs_ct` — Asian Alone Population by Age and Gender (262 vars)
- `b01001e_pi_population_by_age_gender_acs_ct` — Native Hawaiian And Other Pacific Islander Alone Population by Age and Gender (262 vars)
- `b01001f_oth_population_by_age_gender_acs_ct` — Some Other Race Alone Population by Age and Gender (262 vars)
- `b01001g_mlt_population_by_age_gender_acs_ct` — Two Or More Races Population by Age and Gender (262 vars)
- `b01001h_nhw_population_by_age_gender_acs_ct` — White Alone Not Hispanic Or Latino Population by Age and Gender (262 vars)
- `b01001i_lat_population_by_age_gender_acs_ct` — Hispanic Or Latino Population by Age and Gender (262 vars)
- `b01002_med_age_acs_ct` — Median Age by Gender and Race/Ethnicity (60 vars, sibling: `b01002_med_age_acs_m`)
- `b01002_med_age_acs_m` — Median Age by Gender and Race/Ethnicity (60 vars, sibling: `b01002_med_age_acs_ct`)
- `b03002_race_ethnicity_acs_ct` — Population by Race/Ethnicity (38 vars, sibling: `b03002_race_ethnicity_acs_m`)
- `b03002_race_ethnicity_acs_m` — Population by Race/Ethnicity (38 vars, subregion rows, sibling: `b03002_race_ethnicity_acs_ct`)
- `b04006_reported_ancestry_acs_ct` — Reported Ancestry (434 vars, sibling: `b04006_reported_ancestry_acs_m`)
- `b04006_reported_ancestry_acs_m` — Reported Ancestry (434 vars, subregion rows, sibling: `b04006_reported_ancestry_acs_ct`)
- `b05002_citizenship_nativity_acs_ct` — Citizenship Status by Native and Foreign born (18 vars, sibling: `b05002_citizenship_nativity_acs_m`)
- `b05002_citizenship_nativity_acs_m` — Citizenship Status by Native and Foreign born (18 vars, subregion rows, sibling: `b05002_citizenship_nativity_acs_ct`)
- `b05002_place_of_birth_citizenship_nativity_acs_ct` — Citizenship Status by Native and Foreign born with Place of Birth (66 vars, sibling: `b05002_place_of_birth_citizenship_nativity_acs_m`)
- `b05002_place_of_birth_citizenship_nativity_acs_m` — Citizenship Status by Native and Foreign born with Place of Birth (66 vars, subregion rows, sibling: `b05002_place_of_birth_citizenship_nativity_acs_ct`)
- `b05003_citizenship_nativity_by_age_gender_acs_ct` — Citizenship and Foreign Born by Age and Gender (130 vars, sibling: `b05003_citizenship_nativity_by_age_gender_acs_m`)
- `b05003_citizenship_nativity_by_age_gender_acs_m` — Citizenship and Foreign Born by Age and Gender (130 vars, subregion rows, sibling: `b05003_citizenship_nativity_by_age_gender_acs_ct`)
- `b05011_naturalization_by_year_acs_ct` — Time Period of Naturalization (42 vars, sibling: `b05011_naturalization_by_year_acs_m`)
- `b05011_naturalization_by_year_acs_m` — Time Period of Naturalization (42 vars, subregion rows, sibling: `b05011_naturalization_by_year_acs_ct`)
- `b06009_educational_attainment_by_placeofbirth_acs_ct` — Educational Attainment by Place of Birth (56 vars, sibling: `b06009_educational_attainment_by_placeofbirth_acs_m`)
- `b06009_educational_attainment_by_placeofbirth_acs_m` — Educational Attainment by Place of Birth (56 vars, subregion rows, sibling: `b06009_educational_attainment_by_placeofbirth_acs_ct`)
- `b07001_geomobility_in_migration_by_age_acs_ct` — Geographic Mobility: In Migration by Age (338 vars, sibling: `b07001_geomobility_in_migration_by_age_acs_m`)
- `b07001_geomobility_in_migration_by_age_acs_m` — Geographic Mobility: In Migration by Age (338 vars, subregion rows, sibling: `b07001_geomobility_in_migration_by_age_acs_ct`)
- `b07204_geomobility_in_migration_acs_ct` — Geographic Mobility: In Migration (30 vars, sibling: `b07204_geomobility_in_migration_acs_m`)
- `b07204_geomobility_in_migration_acs_m` — Geographic Mobility: In Migration (30 vars, subregion rows, sibling: `b07204_geomobility_in_migration_acs_ct`)
- `b07401_geomobility_out_migration_by_age_acs_m` — Geographic Mobility: Out Migration by Age (280 vars, subregion rows)
- `b07403_geomobility_out_migration_acs_m` — Geographic Mobility: Out Migration (18 vars, subregion rows)
- `b08006_means_transportation_to_work_by_residence_gender_acs_ct` — Means of Transportation to work by Gender (82 vars, sibling: `b08006_means_transportation_to_work_by_residence_gender_acs_m`)
- `b08006_means_transportation_to_work_by_residence_gender_acs_m` — Means of Transportation to work by Gender (82 vars, subregion rows, sibling: `b08006_means_transportation_to_work_by_residence_gender_acs_ct`)
- `b08101_means_transportation_to_work_by_residence_age_acs_ct` — Transportation to Work by Residence by Age (214 vars, sibling: `b08101_means_transportation_to_work_by_residence_age_acs_m`)
- `b08101_means_transportation_to_work_by_residence_age_acs_m` — Transportation to Work by Residence by Age (214 vars, subregion rows, sibling: `b08101_means_transportation_to_work_by_residence_age_acs_ct`)
- `b08105_means_transportation_to_work_by_residence_race_acs_ct` — Means of Transportation to work by Residence by Race (198 vars, sibling: `b08105_means_transportation_to_work_by_residence_race_acs_m`)
- `b08105_means_transportation_to_work_by_residence_race_acs_m` — Means of Transportation to work by Residence by Race (198 vars, subregion rows, sibling: `b08105_means_transportation_to_work_by_residence_race_acs_ct`)
- `b08134_means_by_traveltime_to_work_acs_m` — Means of Transporation to Work by Travel Time (222 vars, subregion rows)
- `b08135_agg_traveltime_to_work_acs_ct` — Aggregate travel time to work (in minutes) of workers by travel time (12 vars, sibling: `b08135_agg_traveltime_to_work_acs_m`)
- `b08135_agg_traveltime_to_work_acs_m` — Aggregate travel time to work (in minutes) of workers by travel time (12 vars, sibling: `b08135_agg_traveltime_to_work_acs_ct`)
- `b08201_hhsize_by_vehicles_acs_ct` — Household Size by Vehicles Available (138 vars, sibling: `b08201_hhsize_by_vehicles_acs_m`)
- `b08201_hhsize_by_vehicles_acs_m` — Household Size by Vehicles Available (138 vars, subregion rows, sibling: `b08201_hhsize_by_vehicles_acs_ct`)
- `b08301_means_transportation_to_work_by_residence_acs_ct` — Transportation to Work by Residence (42 vars, sibling: `b08301_means_transportation_to_work_by_residence_acs_m`)
- `b08301_means_transportation_to_work_by_residence_acs_m` — Transportation to Work by Residence (42 vars, subregion rows, sibling: `b08301_means_transportation_to_work_by_residence_acs_ct`)
- `b08303_traveltime_to_work_by_residence_acs_ct` — Travel Time to Work (30 vars, sibling: `b08303_traveltime_to_work_by_residence_acs_m`)
- `b08303_traveltime_to_work_by_residence_acs_m` — Travel Time to Work (30 vars, subregion rows, sibling: `b08303_traveltime_to_work_by_residence_acs_ct`)
- `b08601_means_transportation_to_work_by_workplace_acs_m` — Transportation to Work from Workplace  (34 vars, subregion rows)
- `b08603_traveltime_to_work_by_placeofwork_acs_m` — Travel Time to Work by Place of Work  (30 vars, subregion rows)
- `b10059_grandparents_grandkids_by_poverty_acs_ct` — Grandparents living with/responsible for own Grandchildren by Poverty Status (38 vars, sibling: `b10059_grandparents_grandkids_by_poverty_acs_m`)
- `b10059_grandparents_grandkids_by_poverty_acs_m` — Grandparents living with/responsible for own Grandchildren by Poverty (38 vars, subregion rows, sibling: `b10059_grandparents_grandkids_by_poverty_acs_ct`)
- `b11005_hh_with_kids_acs_ct` — Households with Children Under 18 (38 vars, sibling: `b11005_hh_with_kids_acs_m`)
- `b11005_hh_with_kids_acs_m` — Households with Children Under 18 (38 vars, subregion rows, sibling: `b11005_hh_with_kids_acs_ct`)
- `b11007_hh_with_seniors_acs_ct` — Households with Seniors (22 vars, sibling: `b11007_hh_with_seniors_acs_m`)
- `b11007_hh_with_seniors_acs_m` — Households with Seniors (22 vars, subregion rows, sibling: `b11007_hh_with_seniors_acs_ct`)
- `b11009_unmarried_partners_hh_acs_ct` — Unmarried Households by Gender (22 vars, sibling: `b11009_unmarried_partners_hh_acs_m`)
- `b11009_unmarried_partners_hh_acs_m` — Unmarried Households by Gender (22 vars, subregion rows, sibling: `b11009_unmarried_partners_hh_acs_ct`)
- `b15001_educational_attainment_by_age_acs_ct` — Educational Attainment by Age (122 vars, sibling: `b15001_educational_attainment_by_age_acs_m`)
- `b15001_educational_attainment_by_age_acs_m` — Educational Attainment by Age (122 vars, subregion rows, sibling: `b15001_educational_attainment_by_age_acs_ct`)
- `b15002_educational_attainment_acs_ct` — Educational Attainment Overall and by Gender (158 vars, sibling: `b15002_educational_attainment_acs_m`)
- `b15002_educational_attainment_acs_m` — Educational Attainment Overall and by Gender (158 vars, subregion rows, sibling: `b15002_educational_attainment_acs_ct`)
- `b16001_language_spoken_and_english_ability_acs_m` — Language Spoken at Home by Ability to Speak English (474 vars, subregion rows)
- `b16004_home_language_english_ability_acs_ct` — Language Spoken at Home by Ability to Speak English (62 vars, sibling: `b16004_home_language_english_ability_acs_m`)
- `b16004_home_language_english_ability_acs_m` — Language Spoken at Home by Ability to Speak English (62 vars, subregion rows, sibling: `b16004_home_language_english_ability_acs_ct`)
- `b16005_nativity_english_ability_by_race_acs_ct` — Nativity and English Ability by Race  (198 vars, sibling: `b16005_nativity_english_ability_by_race_acs_m`)
- `b16005_nativity_english_ability_by_race_acs_m` — Nativity and English Ability by Race (198 vars, subregion rows, sibling: `b16005_nativity_english_ability_by_race_acs_ct`)
- `b17001_poverty_by_age_gender_acs_ct` — Poverty by Age and Gender (122 vars, sibling: `b17001_poverty_by_age_gender_acs_m`)
- `b17001_poverty_by_age_gender_acs_m` — Poverty by Age and Gender (122 vars, subregion rows, sibling: `b17001_poverty_by_age_gender_acs_ct`)
- `b17001_poverty_by_population_acs_ct` — Population in Poverty (6 vars, sibling: `b17001_poverty_by_population_acs_m`)
- `b17001_poverty_by_population_acs_m` — Population in Poverty (6 vars, subregion rows, sibling: `b17001_poverty_by_population_acs_ct`)
- `b17006_child_poverty_by_familytype_acs_ct` — Children in Poverty by Family Type (30 vars, sibling: `b17006_child_poverty_by_familytype_acs_m`)
- `b17006_child_poverty_by_familytype_acs_m` — Children in Poverty by Family Type (30 vars, subregion rows, sibling: `b17006_child_poverty_by_familytype_acs_ct`)
- `b17010_families_with_children_in_poverty_race_acs_ct` — Families with Children in Poverty by Family Type and Race (380 vars, sibling: `b17010_families_with_children_in_poverty_race_acs_m`)
- `b17010_families_with_children_in_poverty_race_acs_m` — Families with Children in Poverty by Family Type and Race (380 vars, subregion rows, sibling: `b17010_families_with_children_in_poverty_race_acs_ct`)
- `b17017_poverty_by_hh_type_acs_ct` — Poverty by Household Type (50 vars, sibling: `b17017_poverty_by_hh_type_acs_m`)
- `b17017_poverty_by_hh_type_acs_m` — Poverty by Household Type (50 vars, subregion rows, sibling: `b17017_poverty_by_hh_type_acs_ct`)
- `b17020_poverty_by_race_age_acs_ct` — Poverty by Race and Age (162 vars, sibling: `b17020_poverty_by_race_age_acs_m`)
- `b17020_poverty_by_race_age_acs_m` — Poverty by Race and Age (162 vars, subregion rows, sibling: `b17020_poverty_by_race_age_acs_ct`)
- `b17026_income_to_poverty_by_families_acs_ct` — Families Ratio Of Income To Poverty Level (70 vars, sibling: `b17026_income_to_poverty_by_families_acs_m`)
- `b17026_income_to_poverty_by_families_acs_m` — Families Ratio Of Income To Poverty Level (70 vars, subregion rows, sibling: `b17026_income_to_poverty_by_families_acs_ct`)
- `b18101_disability_by_gender_age_acs_ct` — Disability Status by Age and Gender (178 vars, sibling: `b18101_disability_by_gender_age_acs_m`)
- `b18101_disability_by_gender_age_acs_m` — Disability Status by Age and Gender (178 vars, subregion rows, sibling: `b18101_disability_by_gender_age_acs_ct`)
- `b18101_thru_b18107_disability_status_acs_m` — Disability Status by Difficulty Type (62 vars, subregion rows)
- `b18101ai_disability_by_age_race_acs_ct` — Disability Status by Age and Race/Ethnicity (414 vars, sibling: `b18101ai_disability_by_age_race_acs_m`)
- `b18101ai_disability_by_age_race_acs_m` — Disability Status by Age and Race/Ethnicity (414 vars, subregion rows, sibling: `b18101ai_disability_by_age_race_acs_ct`)
- `b18102_hearing_difficulty_by_age_acs_m` — Hearing Difficulty by Age (82 vars, subregion rows)
- `b18103_vision_difficulty_by_age_acs_m` — Vision Disability Status by Age (82 vars, subregion rows)
- `b18135_health_insurance_by_disability_status_acs_ct` — Health Insurance Coverage by Disability Status (42 vars, sibling: `b18135_health_insurance_by_disability_status_acs_m`)
- `b18135_health_insurance_by_disability_status_acs_m` — Health Insurance Coverage by Disability Status (42 vars, subregion rows, sibling: `b18135_health_insurance_by_disability_status_acs_ct`)
- `b18140_median_earning_by_disability_status_acs_ct` — Health Insurance Coverage by Disability Status (14 vars, sibling: `b18140_median_earning_by_disability_status_acs_m`)
- `b18140_median_earning_by_disability_status_acs_m` — Health Insurance Coverage by Disability Status (14 vars, subregion rows, sibling: `b18140_median_earning_by_disability_status_acs_ct`)
- `b19001_hh_income_acs_ct` — Household Income (110 vars, sibling: `b19001_hh_income_acs_m`)
- `b19001_hh_income_acs_m` — Household Income (110 vars, subregion rows, sibling: `b19001_hh_income_acs_ct`)
- `b19001_hh_income_race_acs_ct` — Household Income by Race (810 vars)
- `b19013_b19113_b19202_mhi_fam_acs_ct` — Median Household Income by Family Type  (6 vars, sibling: `b19013_b19113_b19202_mhi_fam_acs_m`)
- `b19013_b19113_b19202_mhi_fam_acs_m` — Median Household Income by Family Type (6 vars, sibling: `b19013_b19113_b19202_mhi_fam_acs_ct`)
- `b19013_mhi_race_acs_ct` — Median Household Income by Race (20 vars, sibling: `b19013_mhi_race_acs_m`)
- `b19013_mhi_race_acs_m` — Median Household Income by Race (20 vars, sibling: `b19013_mhi_race_acs_ct`)
- `b19037_hh_income_by_age_acs_ct` — Household Income by Age (114 vars, sibling: `b19037_hh_income_by_age_acs_m`)
- `b19037_hh_income_by_age_acs_m` — Household Income by Age (114 vars, subregion rows, sibling: `b19037_hh_income_by_age_acs_ct`)
- `b19037_hh_income_by_age_race_acs_ct` — Household Income by Age (1026 vars)
- `b19301_per_capita_income_acs_ct` — Per Capita Income (20 vars, sibling: `b19301_per_capita_income_acs_m`)
- `b19301_per_capita_income_acs_m` — Per Capita Income (20 vars, sibling: `b19301_per_capita_income_acs_ct`)
- `b22001_hh_foodstamps_snap_60yrs_acs_ct` — Households receiving Food Stamps/SNAP by presence of people 60 years or over (26 vars, sibling: `b22001_hh_foodstamps_snap_60yrs_acs_m`)
- `b22001_hh_foodstamps_snap_60yrs_acs_m` — Households receiving Food Stamps/SNAP by presence of people 60 years or over (26 vars, subregion rows, sibling: `b22001_hh_foodstamps_snap_60yrs_acs_ct`)
- `b22002_hh_foodstamps_snap_hhtype_kids_acs_ct` — Households receiving Food Stamps/SNAP by presence of children and household type (106 vars, sibling: `b22002_hh_foodstamps_snap_hhtype_kids_acs_m`)
- `b22002_hh_foodstamps_snap_hhtype_kids_acs_m` — Households receiving Food Stamps/SNAP by presence of children and household type (106 vars, subregion rows, sibling: `b22002_hh_foodstamps_snap_hhtype_kids_acs_ct`)
- `b22003_b22005_hh_foodstamps_snap_by_race_acs_ct` — Households receiving Food Stamps/SNAP by Race (86 vars, sibling: `b22003_b22005_hh_foodstamps_snap_by_race_acs_m`)
- `b22003_b22005_hh_foodstamps_snap_by_race_acs_m` — Households receiving Food Stamps/SNAP by Race (86 vars, subregion rows, sibling: `b22003_b22005_hh_foodstamps_snap_by_race_acs_ct`)
- `b22007_fam_foodstamps_snap_famtype_acs_ct` — Families receiving Food Stamps/SNAP by presence of Family Type (170 vars, sibling: `b22007_fam_foodstamps_snap_famtype_acs_m`)
- `b22007_fam_foodstamps_snap_famtype_acs_m` — Families receiving Food Stamps/SNAP by presence of Family Type (170 vars, subregion rows, sibling: `b22007_fam_foodstamps_snap_famtype_acs_ct`)
- `b22008_mhi_foodstamps_snap_acs_ct` — Median Household Income for Households receiving Food Stamps/SNAP (6 vars, sibling: `b22008_mhi_foodstamps_snap_acs_m`)
- `b22008_mhi_foodstamps_snap_acs_m` — Median Household Income for Households receiving Food Stamps/SNAP (6 vars, sibling: `b22008_mhi_foodstamps_snap_acs_ct`)
- `b23006_educational_attainment_by_laborforce_acs_ct` — Educational Attainment by Employment (66 vars, sibling: `b23006_educational_attainment_by_laborforce_acs_m`)
- `b23006_educational_attainment_by_laborforce_acs_m` — Educational Attainment by Employment (66 vars, subregion rows, sibling: `b23006_educational_attainment_by_laborforce_acs_ct`)
- `b23025_employment_acs_ct` — Employment (26 vars, sibling: `b23025_employment_acs_m`)
- `b23025_employment_acs_m` — Employment (26 vars, subregion rows, sibling: `b23025_employment_acs_ct`)
- `b25002_b25003_hu_occupancy_by_tenure_race_acs_m` — Household Occupancy by Race (126 vars, subregion rows)
- `b25004_hu_vacancy_status_acs_ct` — Vacancy Status (Vacant Housing Units) ACS (30 vars, sibling: `b25004_hu_vacancy_status_acs_m`)
- `b25004_hu_vacancy_status_acs_m` — Vacancy Status (Municipal) ACS (30 vars, subregion rows, sibling: `b25004_hu_vacancy_status_acs_ct`)
- `b25007_hh_tenure_by_age_acs_ct` — Household Tenure by Age (118 vars, sibling: `b25007_hh_tenure_by_age_acs_m`)
- `b25007_hh_tenure_by_age_acs_m` — Household Tenure by Age (118 vars, subregion rows, sibling: `b25007_hh_tenure_by_age_acs_ct`)
- `b25010_avg_hhsize_by_tenure_acs_ct` — Average Household Size (6 vars, sibling: `b25010_avg_hhsize_by_tenure_acs_m`)
- `b25010_avg_hhsize_by_tenure_acs_m` — Average Household Size (6 vars, subregion rows, sibling: `b25010_avg_hhsize_by_tenure_acs_ct`)
- `b25024_hu_units_in_structure_acs_ct` — Units in Structures (54 vars, sibling: `b25024_hu_units_in_structure_acs_m`)
- `b25024_hu_units_in_structure_acs_m` — Units in Structures (54 vars, subregion rows, sibling: `b25024_hu_units_in_structure_acs_ct`)
- `b25031_median_rent_by_bedrooms_acs_ct` — Median Rent by Number of Bedrooms (14 vars, sibling: `b25031_median_rent_by_bedrooms_acs_m`)
- `b25031_median_rent_by_bedrooms_acs_m` — Median Rent by Number of Bedrooms (14 vars, subregion rows, sibling: `b25031_median_rent_by_bedrooms_acs_ct`)
- `b25032_hu_tenure_by_units_acs_ct` — Tenure by Housing Units (202 vars, sibling: `b25032_hu_tenure_by_units_acs_m`)
- `b25032_hu_tenure_by_units_acs_m` — Tenure by Housing Units (202 vars, subregion rows, sibling: `b25032_hu_tenure_by_units_acs_ct`)
- `b25041_bedrooms_per_unit_ct` — Bedrooms per housing unit (18 vars, sibling: `b25041_bedrooms_per_unit_m`)
- `b25041_bedrooms_per_unit_m` — Bedrooms per housing unit (18 vars, subregion rows, sibling: `b25041_bedrooms_per_unit_ct`)
- `b25044_hu_vehicles_acs_ct` — Vehicles by Households (66 vars, sibling: `b25044_hu_vehicles_acs_m`)
- `b25044_hu_vehicles_acs_m` — Vehicles by Households (66 vars, subregion rows, sibling: `b25044_hu_vehicles_acs_ct`)
- `b25046_b25044_b01003_hh_vehicle_ownership_acs_m` — Vehicles by Households with aggregations (78 vars, subregion rows)
- `b25056_b25058_contract_rent_acs_ct` — Contract Rent (48 vars, sibling: `b25056_b25058_contract_rent_acs_m`)
- `b25056_b25058_contract_rent_acs_m` — Contract Rent (48 vars, subregion rows, sibling: `b25056_b25058_contract_rent_acs_ct`)
- `b25063_b25064_b25065_rent_acs_ct` — Rent (48 vars)
- `b25065_b25066_aggregate_rent_by_units_acs_ct` — Aggregate Gross Rent by Units in Structure (20 vars, sibling: `b25065_b25066_aggregate_rent_by_units_acs_m`)
- `b25065_b25066_aggregate_rent_by_units_acs_m` — Aggregate Gross Rent by Units in Structure (20 vars, subregion rows, sibling: `b25065_b25066_aggregate_rent_by_units_acs_ct`)
- `b25072_b25093_costburden_by_age_acs_ct` — Housing Cost Burden by Age (156 vars, sibling: `b25072_b25093_costburden_by_age_acs_m`)
- `b25072_b25093_costburden_by_age_acs_m` — Housing Cost Burden by Age (156 vars, subregion rows, sibling: `b25072_b25093_costburden_by_age_acs_ct`)
- `b25074_costburden_renters_by_income_acs_ct` — Housing Cost Burden for Renters by Income (52 vars, sibling: `b25074_costburden_renters_by_income_acs_m`)
- `b25074_costburden_renters_by_income_acs_m` — Housing Cost Burden for Renters by Income (36 vars, subregion rows, sibling: `b25074_costburden_renters_by_income_acs_ct`)
- `b25081_b25082_b25089_b25090_mortgage_status_aggregate_acs_ct` — Mortgage Status for Households with Aggregate Values (34 vars, sibling: `b25081_b25082_b25089_b25090_mortgage_status_aggregate_acs_m`)
- `b25081_b25082_b25089_b25090_mortgage_status_aggregate_acs_m` — Mortgage Status for Households with Aggregate Values (34 vars, subregion rows, sibling: `b25081_b25082_b25089_b25090_mortgage_status_aggregate_acs_ct`)
- `b25091_b25070_costburden_acs_ct` — Housing Cost Burden by Tenure (54 vars, sibling: `b25091_b25070_costburden_acs_m`)
- `b25091_b25070_costburden_acs_m` — Housing Cost Burden by Tenure (54 vars, subregion rows, sibling: `b25091_b25070_costburden_acs_ct`)
- `b25097_median_value_by_mortgage_status_acs_ct` — Median Value by Mortgage Status (6 vars, sibling: `b25097_median_value_by_mortgage_status_acs_m`)
- `b25097_median_value_by_mortgage_status_acs_m` — Median Value by Mortgage Status (6 vars, sibling: `b25097_median_value_by_mortgage_status_acs_ct`)
- `b25106_costburden_by_income_acs_ct` — Housing Cost Burden by Income (88 vars, sibling: `b25106_costburden_by_income_acs_m`)
- `b25106_costburden_by_income_acs_m` — Housing Cost Burden by Income (88 vars, subregion rows, sibling: `b25106_costburden_by_income_acs_ct`)
- `b25117_hu_tenure_by_fuel_acs_ct` — Housing Tenure by Heating Fuel (118 vars, sibling: `b25117_hu_tenure_by_fuel_acs_m`)
- `b25117_hu_tenure_by_fuel_acs_m` — Housing Tenure by Heating Fuel (118 vars, subregion rows, sibling: `b25117_hu_tenure_by_fuel_acs_ct`)
- `b25118_hh_income_by_tenure_acs_ct` — Household Income by Tenure (178 vars, sibling: `b25118_hh_income_by_tenure_acs_m`)
- `b25118_hh_income_by_tenure_acs_m` — Household Income by Tenure (178 vars, subregion rows, sibling: `b25118_hh_income_by_tenure_acs_ct`)
- `b25119_mhi_tenure_acs_ct` — Median Household Income by Tenure (6 vars, sibling: `b25119_mhi_tenure_acs_m`)
- `b25119_mhi_tenure_acs_m` — Median Household Income by Tenure (6 vars, sibling: `b25119_mhi_tenure_acs_ct`)
- `b25127_hu_tenure_year_built_units_acs_ct` — Housing Tenure by Year Built (298 vars, sibling: `b25127_hu_tenure_year_built_units_acs_m`)
- `b25127_hu_tenure_year_built_units_acs_m` — Housing Tenure by Year Built (298 vars, subregion rows, sibling: `b25127_hu_tenure_year_built_units_acs_ct`)
- `b27001_healthinsurance_by_gender_age_acs_ct` — Health Insurance Coverage by Gender and Age (166 vars, sibling: `b27001_healthinsurance_by_gender_age_acs_m`)
- `b27001_healthinsurance_by_gender_age_acs_m` — Health Insurance Coverage by Gender and Age (166 vars, subregion rows, sibling: `b27001_healthinsurance_by_gender_age_acs_ct`)
- `b28012_computer_internet_kids_acs_ct` — Computers and Internet Subscriptions by Age and School Status (Census Tracts) (82 vars, sibling: `b28012_computer_internet_kids_acs_m`)
- `b28012_computer_internet_kids_acs_m` — Computers and Internet Subscriptions by Age and School Status (Municipal) (82 vars, subregion rows, sibling: `b28012_computer_internet_kids_acs_ct`)
- `boun_area_m` — boun_area_m (4 vars)
- `c15002_educational_attainment_by_race_acs_ct` — Educational Attainment by Race/Ethinicity (162 vars, sibling: `c15002_educational_attainment_by_race_acs_m`)
- `c15002_educational_attainment_by_race_acs_m` — Educational Attainment by Race/Ethinicity (162 vars, subregion rows, sibling: `c15002_educational_attainment_by_race_acs_ct`)
- `c16001_language_spoken_at_home_age5up_ct` — C16001 Language Spoken at Home for the Population 5 Years and Over (Municipal) (162 vars, sibling: `c16001_language_spoken_at_home_age5up_m`)
- `c16001_language_spoken_at_home_age5up_m` — C16001 Language Spoken at Home for the Population 5 Years and Over (Municipal) (110 vars, subregion rows, sibling: `c16001_language_spoken_at_home_age5up_ct`)
- `c16001_language_spoken_at_home_rev_m` — C16001 Language Spoken at Home for the Population 5 Years and Over (Municipal) (110 vars, subregion rows)
- `c18120_emp_status_by_disability_status_acs_ct` — Employment Status by Disability Status (58 vars, sibling: `c18120_emp_status_by_disability_status_acs_m`)
- `c18120_emp_status_by_disability_status_acs_m` — Employment Status by Disability Status (74 vars, subregion rows, sibling: `c18120_emp_status_by_disability_status_acs_ct`)
- `c18130_poverty_status_by_disability_status_acs_ct` — Employment Status by Disability Status (110 vars, sibling: `c18130_poverty_status_by_disability_status_acs_m`)
- `c18130_poverty_status_by_disability_status_acs_m` — Employment Status by Disability Status (110 vars, subregion rows, sibling: `c18130_poverty_status_by_disability_status_acs_ct`)
- `c23002_employment_by_race_age_acs_ct` — Employment Status by Race and Age (666 vars, sibling: `c23002_employment_by_race_age_acs_m`)
- `c23002_employment_by_race_age_acs_m` — Employment Status by Race and Age (666 vars, subregion rows, sibling: `c23002_employment_by_race_age_acs_ct`)
- `cdc_places_2020_ct` — CDC Places Dataset 2020 (85 vars)
- `census2010_p12_pop_by_age_ct` — Population by Age (59 vars, sibling: `census2010_p12_pop_by_age_m`)
- `census2010_p12_pop_by_age_gender_ct` — Population by Age and Gender (Census Tract) (87 vars, sibling: `census2010_p12_pop_by_age_gender_m`)
- `census2010_p12_pop_by_age_gender_m` — Population by Age and Gender (Municipal) (87 vars, subregion rows, sibling: `census2010_p12_pop_by_age_gender_ct`)
- `census2010_p12_pop_by_age_m` — Population by Age (59 vars, subregion rows, sibling: `census2010_p12_pop_by_age_ct`)
- `census2010_p12a_whi_race_by_age_gender_ct` — White Population by Age and Gender (87 vars, sibling: `census2010_p12a_whi_race_by_age_gender_m`)
- `census2010_p12a_whi_race_by_age_gender_m` — White Population by Age and Gender (87 vars, subregion rows, sibling: `census2010_p12a_whi_race_by_age_gender_ct`)
- `census2010_p12b_black_race_by_age_gender_ct` — Black Population by Age and Gender (87 vars, sibling: `census2010_p12b_black_race_by_age_gender_m`)
- `census2010_p12b_black_race_by_age_gender_m` — Black Population by Age and Gender (87 vars, subregion rows, sibling: `census2010_p12b_black_race_by_age_gender_ct`)
- `census2010_p12c_na_race_by_age_gender_ct` — American Indian Population by Age and Gender (87 vars, sibling: `census2010_p12c_na_race_by_age_gender_m`)
- `census2010_p12c_na_race_by_age_gender_m` — American Indian Population by Age and Gender (87 vars, subregion rows, sibling: `census2010_p12c_na_race_by_age_gender_ct`)
- `census2010_p12d_asian_race_by_age_gender_ct` — Asian Population by Age and Gender (87 vars, sibling: `census2010_p12d_asian_race_by_age_gender_m`)
- `census2010_p12d_asian_race_by_age_gender_m` — Asian Population by Age and Gender (87 vars, subregion rows, sibling: `census2010_p12d_asian_race_by_age_gender_ct`)
- `census2010_p12e_pi_race_by_age_gender_ct` — Pacific Islander Population by Age and Gender (87 vars, sibling: `census2010_p12e_pi_race_by_age_gender_m`)
- `census2010_p12e_pi_race_by_age_gender_m` — Pacific Islander Population by Age and Gender (87 vars, subregion rows, sibling: `census2010_p12e_pi_race_by_age_gender_ct`)
- `census2010_p12f_other_race_by_age_gender_ct` — Some Other Race Population by Age and Gender (87 vars, sibling: `census2010_p12f_other_race_by_age_gender_m`)
- `census2010_p12f_other_race_by_age_gender_m` — Some Other Race Population by Age and Gender (87 vars, subregion rows, sibling: `census2010_p12f_other_race_by_age_gender_ct`)
- `census2010_p12g_multi_race_by_age_gender_ct` — Multi-Race Population by Age and Gender (87 vars, sibling: `census2010_p12g_multi_race_by_age_gender_m`)
- `census2010_p12g_multi_race_by_age_gender_m` — Multi-Race Population by Age and Gender (87 vars, subregion rows, sibling: `census2010_p12g_multi_race_by_age_gender_ct`)
- `census2010_p12h_hisp_race_by_age_gender_ct` — Hispanic/Latino Population by Age and Gender (87 vars, sibling: `census2010_p12h_hisp_race_by_age_gender_m`)
- `census2010_p12h_hisp_race_by_age_gender_m` — Hispanic/Latino Population by Age and Gender (87 vars, subregion rows, sibling: `census2010_p12h_hisp_race_by_age_gender_ct`)
- `census2010_p12i_nhwhi_race_by_age_gender_ct` — Non-Hispanic White Population by Age and Gender (87 vars, sibling: `census2010_p12i_nhwhi_race_by_age_gender_m`)
- `census2010_p12i_nhwhi_race_by_age_gender_m` — Non-Hispanic White Population by Age and Gender (87 vars, subregion rows, sibling: `census2010_p12i_nhwhi_race_by_age_gender_ct`)
- `census2010_p20_hh_with_kids_by_hhtype_ct` — Households by Presence of Kids and by Household Type (45 vars, sibling: `census2010_p20_hh_with_kids_by_hhtype_m`)
- `census2010_p20_hh_with_kids_by_hhtype_m` — Households by Presence of Kids and by Household Type (45 vars, subregion rows, sibling: `census2010_p20_hh_with_kids_by_hhtype_ct`)
- `census2010_p28_hh_by_hhsize_ct` — Households by Household Size (43 vars, sibling: `census2010_p28_hh_by_hhsize_m`)
- `census2010_p28_hh_by_hhsize_m` — Households by Household Size (43 vars, subregion rows, sibling: `census2010_p28_hh_by_hhsize_ct`)
- `census2020_2010_pop_hu_change_ct` — Population and Housing Unit Changes 2010-2020 (8 vars, sibling: `census2020_2010_pop_hu_change_m`)
- `census2020_2010_pop_hu_change_m` — Population and Housing Unit Changes 2010-2020 (9 vars, subregion rows, sibling: `census2020_2010_pop_hu_change_ct`)
- `census2020_pl94_group_quarters_ct` — Population in Group Quarters 2020 (21 vars, sibling: `census2020_pl94_group_quarters_m`)
- `census2020_pl94_group_quarters_m` — Population in Group Quarters 2020 (21 vars, subregion rows, sibling: `census2020_pl94_group_quarters_ct`)
- `census2020_pl94_hisp_by_race_age_ct` — Population by Race, Ethnicity, and Age 2020 (53 vars, sibling: `census2020_pl94_hisp_by_race_age_m`)
- `census2020_pl94_hisp_by_race_age_m` — Population by Race, Ethnicity, and Age 2020 (53 vars, subregion rows, sibling: `census2020_pl94_hisp_by_race_age_ct`)
- `census2020_pl94_hu_occ_ct` — Housing Units and Occupancy 2020 (5 vars, sibling: `census2020_pl94_hu_occ_m`)
- `census2020_pl94_hu_occ_m` — Housing Units and Occupancy 2020 (5 vars, subregion rows, sibling: `census2020_pl94_hu_occ_ct`)
- `census2020_pl94_race_age_ct` — Population by Race and Age 2020 (53 vars, sibling: `census2020_pl94_race_age_m`)
- `census2020_pl94_race_age_m` — Population by Race and Age 2020 (53 vars, subregion rows, sibling: `census2020_pl94_race_age_ct`)
- `decennial_p12_pop_by_age_ct` — Decennial Population by Age (Census Tracts) (59 vars, sibling: `decennial_p12_pop_by_age_m`)
- `decennial_p12_pop_by_age_m` — Population by Age (59 vars, subregion rows, sibling: `decennial_p12_pop_by_age_ct`)
- `demo_general_demographics_m` — General Demographics and Housing Overview from Census (32 vars, subregion rows)
- `demo_pop_estimates_m` — Population Estimates (1 vars, subregion rows)
- `demo_race_asian_detail_m` — Asian Population by Category (22 vars, subregion rows)
- `demo_race_ethnicity_m` — Population by Age (19 vars, subregion rows)
- `demo_race_latino_detail_m` — Hispanic or Latino Population by Origin (31 vars, subregion rows)
- `econ_hh_income_acs_ct` — econ_hh_income_acs_ct (110 vars, sibling: `econ_hh_income_acs_m`)
- `econ_hh_income_acs_m` — econ_hh_income_acs_m (110 vars, subregion rows, sibling: `econ_hh_income_acs_ct`)
- `econ_municipal_taxes_revenue_m` — Municipal Taxes and Revenue (10 vars, subregion rows)
- `energy_masssave_elec_gas_ci_consumption_m` — MassSave Electricity and Gas Incentives and Savings by Commercial and Industrial sectors (6 vars)
- `energy_masssave_elec_gas_res_li_consumption_m` — MassSave Electricity and Gas Incentives and Savings by Residential and Low Income sector (6 vars)
- `env_wastewater_system_m` — Wastewater System Type by Municipality (3 vars)
- `ghg_landscaped_area_emis_m` — Estimated Landscaped Area for GHG Inventory (2017) (2 vars)
- `health_food_insecurity_omad_ct` — Food Insecurity rates and Meal Gap (17 vars, sibling: `health_food_insecurity_omad_m`)
- `health_food_insecurity_omad_m` — Food Insecurity rates and Meal Gap (17 vars, sibling: `health_food_insecurity_omad_ct`)
- `health_hospitalizations_hypertension_m` — hypertension Related Hospitalizations (49 vars)
- `health_premature_mortality_race_m` — Premature Mortality Overall and by Race/Ethnicity (28 vars)
- `hmda_mortgage_denials_by_race_120k_m` — Mortgage denials by race for upper incomes (over 120K) (18 vars, subregion rows)
- `hmda_mortgage_denials_by_race_120pct_m` — Mortgage denials by race for upper incomes (over 120K) (21 vars, subregion rows)
- `hous_building_permits_m` — Estimated Building Permits by year (15 vars, subregion rows)
- `hous_hh_income_by_cb_chas_ct` — Household Income by Cost Burden Status (82 vars, sibling: `hous_hh_income_by_cb_chas_m`)
- `hous_hh_income_by_cb_chas_m` — Household Income by Cost Burden Status (82 vars, subregion rows, sibling: `hous_hh_income_by_cb_chas_ct`)
- `hous_hh_income_by_hh_type_chas_ct` — Household Income by Household Type (122 vars, sibling: `hous_hh_income_by_hh_type_chas_m`)
- `hous_hh_income_by_hh_type_chas_m` — Household Income by Household Type (122 vars, subregion rows, sibling: `hous_hh_income_by_hh_type_chas_ct`)
- `hous_hh_income_by_tenure_chas_ct` — Household Income by Tenure (86 vars, sibling: `hous_hh_income_by_tenure_chas_m`)
- `hous_hh_income_by_tenure_chas_m` — Household Income by Tenure (86 vars, subregion rows, sibling: `hous_hh_income_by_tenure_chas_ct`)
- `hous_hh_race_by_cb_chas_m` — Households by Race/Ethnicity and Housing Cost Burden (128 vars, subregion rows)
- `hous_hh_type_by_cb_chas_ct` — Household Type by Cost Burdened Status (82 vars, sibling: `hous_hh_type_by_cb_chas_m`)
- `hous_hh_type_by_cb_chas_m` — Household Type by Cost Burdened Status (82 vars, subregion rows, sibling: `hous_hh_type_by_cb_chas_ct`)
- `hous_hh_type_by_hh_income_chas_ct` — Household Type by Houehold Income (146 vars, sibling: `hous_hh_type_by_hh_income_chas_m`)
- `hous_hh_type_by_hh_income_chas_m` — Household Type by Houehold Income (146 vars, subregion rows, sibling: `hous_hh_type_by_hh_income_chas_ct`)
- `hous_hh_type_size_by_seniors_m` — Households by Type and Size by Presence of Seniors from Census (15 vars, subregion rows)
- `hous_overcrowding_chas_ct` — Overcrowded Households (6 vars, sibling: `hous_overcrowding_chas_m`)
- `hous_overcrowding_chas_m` — Overcrowded Households (6 vars, subregion rows, sibling: `hous_overcrowding_chas_ct`)
- `hous_res_sales_by_type_value_ct` — Residential Home Sales by Type and Price (8 vars)
- `hous_section8_income_limits_by_year_m` — HUD Section 8 Income Limts (Municipal) (25 vars)
- `hous_submarkets_ct` — MAPC Housing Submarkets (109 vars)
- `hous_tenure_by_units_acs_m` — hous_tenure_by_units_acs_m (202 vars, subregion rows)
- `s2504_phys_characteristics_for_occ_housing_units_ct` — Physical Characteristics for Occupied Housing Units (Census Tracts) (458 vars, sibling: `s2504_phys_characteristics_for_occ_housing_units_m`)
- `s2504_phys_characteristics_for_occ_housing_units_m` — Physical Characteristics for Occupied Housing Units (Municipal) (458 vars, subregion rows, sibling: `s2504_phys_characteristics_for_occ_housing_units_ct`)
- `s2801_computer_internet_acs_ct` — Types of Computers and Internet Subscriptions (122 vars, sibling: `s2801_computer_internet_acs_m`)
- `s2801_computer_internet_acs_m` — Types of Computers and Internet Subscriptions (116 vars, subregion rows, sibling: `s2801_computer_internet_acs_ct`)
- `speculative_investment_ct` — Homes for Profit Data Aggregation (Census Tracts) (36 vars)