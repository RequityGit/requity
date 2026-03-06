-- =============================================================================
-- SERVICING ENGINE — Phase 2: Seed All Loan, Draw, and Payment Data
-- =============================================================================
-- 56 loans from the Loan Tape, 35 draws from the Draw Log, and payment records.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- LOANS — Active (24 loans)
-- ---------------------------------------------------------------------------

INSERT INTO servicing_loans (loan_id, borrower_name, entity_name, property_address, loan_type, loan_purpose, asset_class, program, loan_status, origination_date, maturity_date, term_months, total_loan_amount, construction_holdback, funds_released, current_balance, draw_funds_available, interest_rate, monthly_payment, payment_type, dutch_interest, fund_name, fund_ownership_pct, origination_fee, exit_fee, purchase_price, origination_value, stabilized_value, additional_collateral_value, ltv_origination, ltc, borrower_credit_score, originator, folder_link, default_rate, effective_rate)
VALUES
-- RQ-0013: Michelle Jerkins / Kinsley Ranch LLC
('RQ-0013', 'Michelle Jerkins', 'Kinsley Ranch LLC',
 '12 Prop LA Portfolio - 320 Holly Ridge Dr. Monroe, LA 71203',
 'Commercial', 'Refinance', 'Multifamily (5+ units)', 'Balance Sheet', 'Active',
 '2024-10-18', '2025-06-18', 8, 780000.00, 158000.00, 622000.00, 315465.16, 158000.00,
 0.120000, 0.00, 'Interest Only', false,
 '-', 0.000000, NULL, NULL, 950000.00, 950000.00, 1700000.00, 0.00,
 0.654737, 0.703971, 680, 'Luis Velez',
 'https://drive.google.com/drive/folders/1asm5eX0jbBnpeCWQc6O1QPZ3mXHEU6LB',
 0.240000, 0.120000),

-- RQ-0018: Mitchell Mims / MIMS-IPR LLC
('RQ-0018', 'Mitchell Mims', 'MIMS-IPR LLC',
 '0 County Road 461, Clanton, AL 35046',
 'Commercial', 'Purchase', 'MH Community', 'Balance Sheet', 'Active',
 '2025-03-21', '2026-03-20', 12, 188000.00, 20000.00, 168000.00, 168000.00, 20000.00,
 0.120000, 0.00, 'Interest Only', false,
 'Requity Income Fund', 1.000000, 5640.00, NULL, 235000.00, 235000.00, 261000.00, 342400.00,
 0.290959, 0.737255, 698, 'Luis Velez',
 'https://drive.google.com/drive/folders/184KRcFb0dZh9CtlNU1DUxGY77rWkSpKF',
 0.240000, 0.120000),

-- RQ-0021: Gino Dapello / City of Titusville Corp (DUTCH)
('RQ-0021', 'Gino Dapello', 'City of Titusville Corp',
 '1319 Hillcrest Dr, Daytona Beach, FL 32114',
 'RTL', 'Purchase', 'Residential (Up to 4 units)', 'Balance Sheet', 'Active',
 '2025-05-23', '2026-05-22', 12, 130000.00, 48600.00, 115400.00, 115400.00, 14600.00,
 0.120000, 0.00, 'Interest Only', true,
 'Requity Income Fund', 1.000000, 2600.00, NULL, 99750.00, 99750.00, 200000.00, 0.00,
 0.816040, 0.876306, 650, 'Luis Velez',
 'https://drive.google.com/drive/folders/1N6euvTtfQkGJnp8rqZiCAgd8SqBmnsKw',
 0.240000, 0.120000),

-- RQ-0023: Timothy Reimer / Eureka Schoolhouse LLC (NO interest_rate in source data)
('RQ-0023', 'Timothy Reimer', 'Eureka Schoolhouse LLC',
 '2944 State St, Eureka, WI 54963',
 'RTL', 'Purchase', 'Residential (Up to 4 units)', 'Balance Sheet', 'Active',
 '2025-05-27', '2026-05-26', 12, 165000.00, 0.00, 165000.00, 165000.00, 0.00,
 NULL, 0.00, 'Interest Only', false,
 'Requity Income Fund', 0.011160, 6600.00, NULL, 196971.00, 196971.00, 257000.00, 0.00,
 0.837687, 0.837687, 750, 'Luis Velez',
 'https://drive.google.com/drive/folders/1dLBZOEdaFeY014Q0PpSanA2yPmIssDFr',
 NULL, NULL),

-- RQ-0024: Gino Dapello & Iris Terrones / M&O Florida Investments LLC (DUTCH)
('RQ-0024', 'Gino Dapello & Iris Terrones', 'M&O Florida Investments LLC',
 '23102 Maclellan Ave, Port Charlotte, FL 33980',
 'RTL', 'Purchase', 'Residential (Up to 4 units)', 'Balance Sheet', 'Active',
 '2025-06-04', '2026-06-03', 12, 198000.00, 31800.00, 198000.00, 198000.00, 0.00,
 0.120000, 0.00, 'Interest Only', true,
 'Requity Income Fund', 0.011160, 3960.00, NULL, 195000.00, 195000.00, 380000.00, 0.00,
 0.852308, 0.873016, 700, 'Luis Velez',
 'https://drive.google.com/drive/folders/1sy6PVFhjgsDECIR_Beo7VkqJLZMV33fd',
 0.240000, 0.120000),

-- RQ-0026: Irina Rossana Mora Márquez / I & B Building Dreams LLC (DUTCH)
('RQ-0026', 'Irina Rossana Mora Márquez', 'I & B Building Dreams LLC',
 '209/211 Eben St, Albemarle, NC 28001',
 'RTL', 'Purchase', 'Residential (Up to 4 units)', 'Balance Sheet', 'Active',
 '2025-06-26', '2026-06-25', 12, 164000.00, 86000.00, 133200.00, 133200.00, 30800.00,
 0.120000, 0.00, 'Interest Only', true,
 'Requity Income Fund', 1.000000, 5000.00, NULL, 127138.00, 127138.00, 342000.00, 0.00,
 0.613507, 0.769455, 680, 'Luis Velez',
 'https://drive.google.com/drive/folders/10opdDTfSK1KJ8GIlNp48xGgFSVsUIX3x',
 0.240000, 0.120000),

-- RQ-0028: Lucas Vinhaes / Ranchwood Estates LLC
('RQ-0028', 'Lucas Vinhaes', 'Ranchwood Estates LLC',
 'Ranchwood MHP: 3021 Arn Cir, Bucyrus, OH 44820',
 'Commercial', 'Purchase', 'MH Community', 'Balance Sheet', 'Active',
 '2025-06-17', '2026-06-16', 12, 500000.00, NULL, 500000.00, 500000.00, 0.00,
 0.120000, 0.00, 'Interest Only', false,
 '-', 0.000000, 14000.00, NULL, NULL, 930000.00, NULL, NULL,
 0.537634, NULL, 660, 'Luis Velez',
 'https://drive.google.com/drive/folders/1k0deBjzVzxB538Q3UoHF5BEzyQfz3h_V',
 0.240000, 0.120000),

-- RQ-0029: Diego Fernando Restrepo Serna / RH Projects Corp (DUTCH)
('RQ-0029', 'Diego Fernando Restrepo Serna', 'RH Projects Corp',
 '7807 N Mulberry St, Tampa, FL 33604',
 'RTL', 'Purchase', 'Residential (Up to 4 units)', 'Balance Sheet', 'Active',
 '2025-07-25', '2026-07-24', 12, 168000.00, 50000.00, 168000.00, 168000.00, 0.00,
 0.120000, 0.00, 'Interest Only', true,
 'Requity Income Fund', 1.000000, 4200.00, NULL, 150000.00, 150000.00, 240000.00, 0.00,
 0.786667, 0.840000, 640, 'Luis Velez',
 'https://drive.google.com/drive/folders/1lA62chpDRwsHYBrNu7tXcbLW3TeTq3PS',
 0.240000, 0.120000),

-- RQ-0030: Luis Ernesto Moscotte / LEM RE Services LLC (DUTCH)
('RQ-0030', 'Luis Ernesto Moscotte', 'LEM RE Services LLC',
 '221 E Herman St, Newton, NC 28658',
 'RTL', 'Purchase', 'Residential (Up to 4 units)', 'Balance Sheet', 'Active',
 '2025-07-25', '2026-07-24', 12, 150000.00, 35000.00, 150000.00, 150000.00, 0.00,
 0.120000, 0.00, 'Interest Only', true,
 'Requity Income Fund', 1.000000, 6000.00, NULL, 150000.00, 150000.00, 218000.00, 0.00,
 0.766667, 0.810811, 660, 'Luis Velez',
 'https://drive.google.com/drive/folders/1L7wGVqWd4iLIWhPK1MAR4P_OqH-__aNJ',
 0.240000, 0.120000),

-- RQ-0031: Maria Mercedes Intriago Meza / CAPITALNEST PROPERTIES LLC (DUTCH)
('RQ-0031', 'Maria Mercedes Intriago Meza and Nelson Vicente Vargas Azanza',
 'CAPITALNEST PROPERTIES LLC and NCA PROPERTY HOMES LLC',
 '3420 Ave R NW, Winter Haven, FL 33881',
 'RTL', 'Purchase', 'Residential (Up to 4 units)', 'Balance Sheet', 'Active',
 '2025-08-28', '2026-08-27', 12, 90000.00, 45000.00, 90000.00, 90000.00, 0.00,
 0.120000, 0.00, 'Interest Only', true,
 'Requity Income Fund', 1.000000, 6000.00, NULL, 76000.00, 76000.00, 154600.00, 0.00,
 0.592105, 0.743802, 600, 'Luis Velez',
 'https://drive.google.com/drive/folders/1GTZWjJX7jHkc9uDzQcu9Hvzp8qGSmcBp',
 0.240000, 0.120000),

-- RQ-0032: Alexander Thomas Donnolo / Walnut Grove MHP LLC
('RQ-0032', 'Alexander Thomas Donnolo', 'Walnut Grove MHP LLC',
 '1202 Walnut St, Idalou, TX 79329',
 'Commercial', 'Refinance', 'MH Community', 'Balance Sheet', 'Active',
 '2025-08-29', '2026-08-28', 12, 700000.00, 0.00, 700000.00, 700000.00, 0.00,
 0.120000, 0.00, 'Interest Only', false,
 'Requity Income Fund', 1.000000, 14000.00, 14000.00, 835000.00, 1125000.00, 1400000.00, 0.00,
 0.622222, 0.838323, 730, 'Luis Velez',
 'https://drive.google.com/drive/u/0/folders/1OlVOp2Em8sMhDSDgDC7n95FtX9RCwWNY',
 0.240000, 0.120000),

-- RQ-0033: Wendy Sue Groninger / Wood and Stone RE Holdings LLC
('RQ-0033', 'Wendy Sue Groninger and Stepan Crown Groninger', 'Wood and Stone RE Holdings LLC',
 '698 S Salisbury St, Mocksville, NC 27028',
 'RTL', 'Purchase', 'Residential (Up to 4 units)', 'Balance Sheet', 'Active',
 '2025-09-05', '2026-09-04', 12, 274000.00, NULL, 274000.00, 274000.00, 0.00,
 0.120000, 0.00, 'Interest Only', false,
 'Requity Income Fund', 1.000000, 5480.00, 5480.00, 148500.00, 148500.00, 271694.00, 262100.00,
 1.845118, 1.845118, 736, 'Luis Velez',
 'https://drive.google.com/drive/folders/1OEDiyJ7-WR-oVDnFrAXv9ktIbly2kHYx',
 0.240000, 0.120000),

-- RQ-0047: Anthony David Fazio / MI03 Property LLC
('RQ-0047', 'Anthony David Fazio and Stevie Nicole Fazio', 'MI03 Property LLC',
 '11042 NW 39th Way, Jasper, FL 32052',
 'Commercial', 'Purchase', 'MH Community', 'Balance Sheet', 'Active',
 '2025-10-29', '2027-10-29', 24, 375000.00, 75000.00, 300000.00, 300000.00, 75000.00,
 0.120000, 0.00, 'Interest Only', false,
 'Requity Income Fund', 1.000000, 7500.00, 3750.00, 375000.00, 375000.00, 804000.00, 0.00,
 0.800000, 0.833333, 805, 'Luis Velez',
 'https://drive.google.com/drive/u/0/folders/1UfMymXA7IT1UJ-dfIiLe3cahBIjdQVPU',
 0.240000, 0.120000),

-- RQ-0048: Bryan Jules Richard / Next Summit Ventures LLC
('RQ-0048', 'Bryan Jules Richard and Natalie Simpson', 'Next Summit Ventures LLC',
 'Goldmine Village MHP: 15 separate parcels',
 'Commercial', 'Refinance', 'MH Community', 'Balance Sheet', 'Active',
 '2025-10-31', '2026-10-31', 12, 450000.00, 0.00, 450000.00, 450000.00, 0.00,
 0.120000, 0.00, 'Interest Only', false,
 'Requity Income Fund', 1.000000, 9000.00, 4500.00, 450000.00, 750000.00, 634000.00, 0.00,
 0.600000, 1.000000, 724, 'Luis Velez',
 'https://drive.google.com/drive/u/0/folders/1yq1dhHfZP96R797zv7UBDVhjY8xo6zmX',
 0.240000, 0.120000),

-- RQ-0051: Eduardo Irrazabal / RIO Team Inc (DUTCH)
('RQ-0051', 'Eduardo Irrazabal', 'RIO Team Inc',
 '2001 Country Club Ct, Plant City, FL 33566',
 'RTL', 'Purchase', 'Residential (Up to 4 units)', 'Balance Sheet', 'Active',
 '2025-11-18', '2026-11-18', 12, 220000.00, 60000.00, 185000.00, 185000.00, 35000.00,
 0.120000, 0.00, 'Interest Only', true,
 'Requity Income Fund', 1.000000, 4400.00, 2200.00, 189000.00, 220000.00, 449000.00, 0.00,
 0.727273, 0.883534, 774, 'Luis Velez',
 'https://drive.google.com/drive/folders/1Y_m9DEbmlnm6DKjmeQcOT2VIeTW8FwPQ',
 0.240000, 0.120000),

-- RQ-0053: Cristian Schefer / Woodlux Cabinets LLC (DUTCH)
('RQ-0053', 'Cristian Schefer', 'Woodlux Cabinets LLC',
 '195 45th Ave, St Pete Beach, FL 33706',
 'RTL', 'Purchase', 'Residential (Up to 4 units)', 'Balance Sheet', 'Active',
 '2025-11-21', '2026-11-21', 12, 369000.00, 65000.00, 304000.00, 304000.00, 65000.00,
 0.120000, 0.00, 'Interest Only', true,
 'Requity Income Fund', 1.000000, 7380.00, 3690.00, 380000.00, 526777.00, 530000.00, 0.00,
 0.577094, 0.829213, 771, 'Luis Velez',
 'https://drive.google.com/drive/folders/1z6YKzCo6IfbymLLZv6dZK_erlDIEhVM_',
 0.240000, 0.120000),

-- RQ-0054: David Bleke / David Bleke LLC
('RQ-0054', 'David Bleke', 'David Bleke LLC',
 '2467 S 25 W Franklin, IN 46131',
 'RTL', 'Purchase', 'Residential (Up to 4 units)', 'Balance Sheet', 'Active',
 '2025-11-21', '2026-11-21', 12, 225000.00, 0.00, 225000.00, 225000.00, 0.00,
 0.120000, 0.00, 'Interest Only', false,
 'Requity Income Fund', 1.000000, 6750.00, NULL, 225000.00, 330000.00, 330000.00, 70000.00,
 0.681818, 1.000000, 688, 'Estefania',
 'https://drive.google.com/drive/folders/1RemOoEuI7DbhPpk98HxvAtoSZa-YOE_R',
 0.240000, 0.120000),

-- RQ-0059: Wendy Dunnavant Prine / The Prine Group LLC
('RQ-0059', 'Wendy Dunnavant Prine', 'The Prine Group LLC',
 '48153 State Hwy 59, Bay Minette, AL 36507',
 'Commercial', 'Purchase', 'MH Community', 'Balance Sheet', 'Active',
 '2025-12-16', '2027-01-01', 13, 310000.00, 0.00, 310000.00, 310000.00, 0.00,
 0.120000, 0.00, 'Interest Only', false,
 'Requity Income Fund', 1.000000, 6200.00, 6200.00, 310000.00, 481000.00, 545000.00, 171000.00,
 0.644491, 1.000000, 700, 'Luis Velez',
 'https://drive.google.com/drive/folders/1gY3xR7hG2s2PfnrS98wPjPIvOkb8I0ML',
 0.240000, 0.120000),

-- RQ-0061: Manrup Singh Sandhu / Clarksville Estates MHP LLC
('RQ-0061', 'Manrup Singh Sandhu and Simran Singh Sandhu', 'Clarksville Estates MHP LLC',
 '400 S Fremont St, Clarksville, IA 50619',
 'Commercial', 'Purchase', 'MH Community', 'Balance Sheet', 'Active',
 '2026-01-09', '2027-01-09', 12, 348500.00, 51000.00, 297500.00, 297500.00, 51000.00,
 0.120000, 0.00, 'Interest Only', false,
 'Requity Income Fund', 1.000000, 6970.00, 3485.00, 350000.00, 450000.00, 1164000.00, 0.00,
 0.661111, 0.869077, 760, 'Luis Velez',
 'https://drive.google.com/drive/folders/1fOLR1_pCZWhZ0YyZe2FsP90NIKMSz7nH',
 0.240000, 0.120000),

-- RQ-0062: Dylan Lee Legge / A-Z Estates of Island Creek LLC
('RQ-0062', 'Dylan Lee Legge', 'A-Z Estates of Island Creek LLC',
 '2227 Island Creek Rd Pikeville, KY 41501',
 'Commercial', 'Refinance', 'MH Community', 'Balance Sheet', 'Active',
 '2026-01-26', '2027-08-01', 18, 1300000.00, 0.00, 1300000.00, 1300000.00, 0.00,
 0.120000, 0.00, 'Interest Only', false,
 'Requity Income Fund', 0.230769, 26000.00, 13000.00, 2420000.00, 2420000.00, 3020000.00, 0.00,
 0.537190, 0.537190, 616, 'Luis Velez',
 'https://drive.google.com/drive/folders/1E9sq0XCDGHE-HpObqYf3bn0sjiy_wImw',
 0.240000, 0.120000),

-- RQ-0063: David Glen Voigt / TyBella Estates LLC
('RQ-0063', 'David Glen Voigt and Sara Voigt',
 'TyBella Estates LLC and Balanced Health By Sara LLC',
 '1179 Gissendanner Rd, Midland City, AL 36350',
 'Commercial', 'Purchase', 'MH Community', 'Balance Sheet', 'Active',
 '2026-01-26', '2027-08-01', 18, 250000.00, 0.00, 250000.00, 250000.00, 0.00,
 0.120000, 0.00, 'Interest Only', false,
 'Requity Income Fund', 1.000000, 5000.00, 5000.00, 1020000.00, 1020000.00, 1020000.00, 0.00,
 0.245098, 0.245098, 765, 'Luis Velez',
 'https://drive.google.com/drive/folders/1HSF32kPrdB0TOXOCagYaIWthcZquJsYV',
 0.240000, 0.120000),

-- RQ-0070: Cristian David Schefer / Woodlux Cabinets LLC (DUTCH)
('RQ-0070', 'Cristian David Schefer', 'Woodlux Cabinets LLC',
 '15416 2nd St E, Madeira Beach, FL 33708',
 'RTL', 'Purchase', 'Residential (Up to 4 units)', 'Balance Sheet', 'Active',
 '2026-02-02', '2027-03-01', 13, 331500.00, NULL, 331500.00, 331500.00, 0.00,
 0.120000, 0.00, 'Interest Only', true,
 'Requity Income Fund', 1.000000, 6630.00, 3315.00, 360000.00, 360000.00, 660969.00, 0.00,
 0.920833, 0.920833, 771, 'Luis Velez',
 'https://drive.google.com/drive/folders/1fHQsH9ZRAW8ISfz3mtqnfai195U4qBE9',
 0.240000, 0.120000),

-- RQ-0071: Eduardo Irrazabal / RIO Team Inc (DUTCH)
('RQ-0071', 'Eduardo Irrazabal', 'RIO Team Inc',
 '65 Iris St Clearwater, FL 33767',
 'RTL', 'Purchase', 'Residential (Up to 4 units)', 'Balance Sheet', 'Active',
 '2026-02-11', '2027-03-01', 13, 595000.00, 25000.00, 570000.00, 570000.00, 25000.00,
 0.120000, 0.00, 'Interest Only', true,
 'Requity Income Fund', 0.500000, 11900.00, 5950.00, 675000.00, 675000.00, 1222000.00, 0.00,
 0.844444, 0.850000, 774, 'Luis Velez',
 'https://drive.google.com/drive/u/0/folders/1xG385nl6Z_ouMa2hlwI1b_fBf8nNJMMW',
 0.240000, 0.120000),

-- RQ-0072: Norman Skillings III / Lakeland MHP LLC
('RQ-0072', 'Norman Skillings III', 'Lakeland MHP LLC',
 '1212 Plant Ave, Lakeland, FL 33805',
 'Commercial', 'Purchase', 'MH Community', 'Balance Sheet', 'Active',
 '2026-02-12', '2027-08-01', 18, 290000.00, 0.00, 290000.00, 290000.00, 0.00,
 0.120000, 0.00, 'Interest Only', false,
 'Requity Income Fund', 1.000000, 6000.00, 4000.00, 410000.00, 410000.00, 420000.00, 0.00,
 0.707317, 0.707317, 800, 'Luis Velez',
 'https://drive.google.com/drive/folders/16IbyD-pyhNe9szTwV6FF6BmDq_4Dpkyo',
 0.240000, 0.120000);


-- ---------------------------------------------------------------------------
-- LOANS — Paid Off (22 loans)
-- ---------------------------------------------------------------------------

INSERT INTO servicing_loans (loan_id, borrower_name, entity_name, property_address, loan_type, loan_purpose, asset_class, program, loan_status, origination_date, maturity_date, term_months, total_loan_amount, construction_holdback, funds_released, current_balance, draw_funds_available, interest_rate, monthly_payment, payment_type, dutch_interest, fund_name, fund_ownership_pct, origination_fee, exit_fee, purchase_price, origination_value, stabilized_value, additional_collateral_value, ltv_origination, ltc, borrower_credit_score, originator, folder_link, default_rate, effective_rate)
VALUES
-- RQ-0001
('RQ-0001', NULL, NULL,
 '817 Powers Ave, Nashville, TN 37206',
 'RTL', 'Purchase', 'Residential (Up to 4 units)', 'Balance Sheet', 'Paid Off',
 NULL, NULL, NULL, 360000.00, NULL, 360000.00, 360000.00, 0.00,
 0.120000, 0.00, 'Interest Only', false,
 '-', 0.000000, NULL, NULL, NULL, NULL, NULL, NULL,
 NULL, NULL, NULL, NULL,
 'https://drive.google.com/drive/folders/1uyfUhMPf7Tx-csnEzZXFSIoaDBIxzaAK',
 0.240000, 0.120000),

-- RQ-0002
('RQ-0002', NULL, NULL,
 '326 Valeria St. Nashville, TN 37210',
 'RTL', 'Purchase', 'Residential (Up to 4 units)', 'Balance Sheet', 'Paid Off',
 NULL, NULL, NULL, 230000.00, NULL, 230000.00, 0.00, 0.00,
 0.120000, 0.00, 'Interest Only', false,
 '-', 0.000000, NULL, NULL, NULL, NULL, NULL, NULL,
 NULL, NULL, NULL, NULL,
 'https://drive.google.com/drive/folders/1dHP7c8rSVqnwoWmsRUH1k5WvbXWa9EBt',
 0.240000, 0.120000),

-- RQ-0003
('RQ-0003', 'William Coleman', 'UrbanGate Capital, LLC',
 '1023 Ridgecrest Dr. Clarksville, TN 37040',
 'RTL', 'Purchase', 'Residential (Up to 4 units)', 'Balance Sheet', 'Paid Off',
 NULL, NULL, NULL, 100000.00, NULL, 100000.00, 0.00, 0.00,
 0.120000, 0.00, 'Interest Only', false,
 '-', 0.000000, NULL, NULL, NULL, NULL, NULL, NULL,
 NULL, NULL, NULL, NULL,
 'https://drive.google.com/drive/folders/1qv6Jj2xlYdz2oqbTGDFvUnGTMyqC9teK',
 0.240000, 0.120000),

-- RQ-0004
('RQ-0004', 'Diego Restrepo', 'RH Projects Corp',
 '37920 Pine Street, Dade City, FL 33525',
 'RTL', 'Purchase', 'Residential (Up to 4 units)', 'Balance Sheet', 'Paid Off',
 '2024-02-23', '2024-08-23', 6, 150000.00, 30000.00, 120000.00, 120000.00, 30000.00,
 0.120000, 0.00, 'Interest Only', false,
 '-', 0.000000, NULL, NULL, 190000.00, 190000.00, 315000.00, 0.00,
 0.631579, 0.681818, 640, 'Luis Velez',
 'https://drive.google.com/drive/folders/1cGdb7pxtN-hxRzYoQlqS4Z5gRgvF7dol',
 0.240000, 0.120000),

-- RQ-0005
('RQ-0005', 'Ferney Correa', 'Fer Construction LLC',
 '4511 Picadilly Street Tampa, FL 33634',
 'RTL', 'Purchase', 'Residential (Up to 4 units)', 'Balance Sheet', 'Paid Off',
 '2024-04-11', '2024-10-11', 6, 320000.00, 80000.00, 240000.00, 0.00, 80000.00,
 0.120000, 0.00, 'Interest Only', false,
 '-', 0.000000, NULL, NULL, 325000.00, 325000.00, 525000.00, 0.00,
 0.738462, 0.790123, 742, 'Luis Velez',
 'http://drive.google.com/drive/folders/1SZ-83BM4f_ZupYVO61u2CXykmYr_ra7_',
 0.240000, 0.120000),

-- RQ-0006
('RQ-0006', 'Garrett Terrell', 'AL Southern Oak Series LLC – 1991 Bell St Protected Series',
 '1991 Bell Street Montgomery, AL',
 'Commercial', 'Refinance', 'MH Community', 'Balance Sheet', 'Paid Off',
 '2024-03-29', '2025-01-29', 10, 1224000.00, 0.00, 1224000.00, 0.00, 0.00,
 0.120000, 0.00, 'Interest Only', false,
 '-', 0.000000, NULL, NULL, 2000000.00, 2040000.00, 2040000.00, 0.00,
 0.600000, 0.612000, 720, 'Luis Velez',
 'https://drive.google.com/drive/folders/1bRW1B7P6MqAK3TfjU1c0i9QBzRYq4cQe',
 0.240000, 0.120000),

-- RQ-0007
('RQ-0007', 'Yeico Jaramillo', 'Emmar LLC',
 '305 W. Dr MLK Blvd Tampa, FL 33603',
 'RTL', 'Purchase', 'Residential (Up to 4 units)', 'Balance Sheet', 'Paid Off',
 '2024-03-26', '2024-09-26', 6, 230000.00, 100000.00, 130000.00, 0.00, 100000.00,
 0.120000, 0.00, 'Interest Only', false,
 '-', 0.000000, NULL, NULL, 205000.00, 205000.00, 405000.00, 0.00,
 0.634146, 0.754098, 711, 'Luis Velez',
 'https://drive.google.com/drive/folders/1Ekg4swXmEeMHtMz-USJQqc2esfnQNDSU',
 0.240000, 0.120000),

-- RQ-0008
('RQ-0008', 'Diego Restrepo', 'Rest and Jara Investments LLC',
 '3407 East 21st Avenue, Tampa, FL 33605',
 'RTL', 'Purchase', 'Residential (Up to 4 units)', 'Balance Sheet', 'Paid Off',
 '2024-04-19', '2024-10-19', 6, 180000.00, 100000.00, 80000.00, 0.00, 100000.00,
 0.120000, 0.00, 'Interest Only', false,
 '-', 0.000000, NULL, NULL, 213000.00, 213000.00, 400000.00, 0.00,
 0.375587, 0.575080, 640, 'Luis Velez',
 'https://drive.google.com/drive/folders/1vy3hrQcQdoGjEY5Gax44zhqfuri0VkZI',
 0.240000, 0.120000),

-- RQ-0009
('RQ-0009', 'Yeico Jaramillo', 'Peninsula Property Partners LLC',
 '4467 Michigan Ln, Clearwater FL 33762',
 'RTL', 'Purchase', 'Residential (Up to 4 units)', 'Balance Sheet', 'Paid Off',
 '2024-04-30', '2024-10-30', 6, 250000.00, 30000.00, 220000.00, 0.00, 30000.00,
 0.120000, 0.00, 'Interest Only', false,
 '-', 0.000000, NULL, NULL, 283299.00, 283299.00, 390000.00, 0.00,
 0.776565, 0.797960, 771, 'Luis Velez',
 'https://drive.google.com/drive/folders/12jcilmyJ7PtuqtMulu7WykJGDe-8cJSr',
 0.240000, 0.120000),

-- RQ-0010
('RQ-0010', 'Michelle Jerkins', 'Kinsley Ranch LLC',
 '298 Defreese Rd West Monroe, LA 71291',
 'RTL', 'Refinance', 'Residential (Up to 4 units)', 'Balance Sheet', 'Paid Off',
 '2024-09-27', '2025-02-27', 5, 88000.00, 16100.00, 71900.00, 0.00, 16100.00,
 0.120000, 0.00, 'Interest Only', false,
 '-', 0.000000, NULL, NULL, 110000.00, 110000.00, 155000.00, NULL,
 0.653636, 0.697859, 680, 'Luis Velez',
 'https://drive.google.com/drive/folders/1sqtZd_hrR4K29earEmrgnMNjLG2jny6A',
 0.240000, 0.120000),

-- RQ-0011 (DUTCH)
('RQ-0011', 'Beverly Hosey', 'Hosey Ice LLC',
 '620 W 2nd Street Washington, NC 27889',
 'RTL', 'Purchase', 'Residential (Up to 4 units)', 'Balance Sheet', 'Paid Off',
 '2024-09-16', '2025-03-16', 6, 480000.00, 200000.00, 280000.00, 0.00, 200000.00,
 0.120000, 0.00, 'Interest Only', true,
 '-', 0.000000, NULL, NULL, 330000.00, 330000.00, 750000.00, 0.00,
 0.848485, 0.905660, NULL, 'Luis Velez',
 'https://drive.google.com/drive/folders/1iMujVsU-W4g9g9SIzVYU4kjNuCtm3GN5',
 0.240000, 0.120000),

-- RQ-0012
('RQ-0012', 'Anthony Fazio', 'MI03 Property LLC',
 '284 NW Ridgewood Ave Lake City, FL 32055',
 'Commercial', 'Purchase', 'MH Community', 'Balance Sheet', 'Paid Off',
 '2024-10-22', '2026-10-22', 24, 340000.00, 0.00, 340000.00, 0.00, 0.00,
 0.120000, 0.00, 'Interest Only', false,
 '-', 0.000000, NULL, NULL, 383000.00, 450000.00, 600000.00, 0.00,
 0.755556, 0.887728, NULL, 'Luis Velez',
 'https://drive.google.com/drive/folders/1VLAVry-GFqFrgM6qxLvqd7IQhmd0iw7k',
 0.240000, 0.120000),

-- RQ-0014 (DUTCH)
('RQ-0014', 'Jose R Perez Echemendia', 'JL Caribe Air Conditioning & Heating Services Inc',
 '8906 N. Albany Ave Tampa, FL 33604',
 'RTL', 'Refinance', 'Residential (Up to 4 units)', 'Balance Sheet', 'Paid Off',
 '2024-10-31', '2025-07-31', 9, 240000.00, 80000.00, 160000.00, 0.00, 80000.00,
 0.120000, 0.00, 'Interest Only', true,
 '-', 0.000000, NULL, NULL, 250000.00, 250000.00, 440000.00, 0.00,
 0.640000, 0.727273, 786, 'Luis Velez',
 'https://drive.google.com/drive/folders/115AS_asZVU9V6YDJeSSEd22W4aaFdh-A',
 0.240000, 0.120000),

-- RQ-0015
('RQ-0015', 'Michael Yerger', 'Unadilla Hwy LLC',
 '417 Unadilla Hwy Hawkinsville, GA 31036',
 'Commercial', 'Refinance', 'MH Community', 'Balance Sheet', 'Paid Off',
 '2024-12-26', '2025-12-26', 12, 1000000.00, 0.00, 1000000.00, 0.00, 0.00,
 0.120000, 0.00, 'Interest Only', false,
 '-', 0.000000, NULL, NULL, 1650000.00, 1650000.00, 2000000.00, 0.00,
 0.606061, 0.606061, 754, 'Luis Velez',
 'https://drive.google.com/drive/folders/1aVCkTjLgB2z5B5qeSe8AN4s4fqJ4CC7v',
 0.240000, 0.120000),

-- RQ-0016 (Transactional — N/A interest rate → NULL)
('RQ-0016', 'Brett Bowman', 'Bowman Investment Group LLC',
 '10680 Highway 23 Belle Chasse, LA 70037',
 'Transactional', 'Transactional', 'RV Campground', 'Transactional', 'Paid Off',
 '2024-12-30', '2025-12-30', 12, 1700000.00, 0.00, 1700000.00, 1700000.00, 0.00,
 NULL, 0.00, 'Interest Only', false,
 '-', 0.000000, 34000.00, NULL, 2500000.00, 2500000.00, 0.00, NULL,
 0.680000, 0.680000, NULL, 'Luis Velez',
 'https://drive.google.com/drive/folders/1cZl1mI5yDkjxsKfb5BUy6ZsPlQOpKt9r',
 NULL, NULL),

-- RQ-0017 (DUTCH)
('RQ-0017', 'Yeico Jaramillo', 'Peninsula Property Partners LLC',
 '9201 Spy Glass Ct Tampa, FL 33615',
 'RTL', 'Purchase', 'Residential (Up to 4 units)', 'Balance Sheet', 'Paid Off',
 '2025-02-28', '2025-10-28', 8, 230000.00, 40000.00, 190000.00, 0.00, 40000.00,
 0.120000, 0.00, 'Interest Only', true,
 '-', 0.000000, 5000.00, NULL, 235000.00, 235000.00, 355000.00, 0.00,
 0.808511, 0.836364, 711, 'Luis Velez',
 'https://drive.google.com/drive/folders/1HcFrgpubzwCAIwMyLFjydmfgqG8ho-yn',
 0.240000, 0.120000),

-- RQ-0020 (interest_rate is "10% (Sold Note)" → 0.10)
('RQ-0020', 'Roberto Reyes', 'Brooksville Renovations Inc',
 '4254 NW 201st St, Miami Gardens, FL 33055',
 'RTL', 'Purchase', 'Residential (Up to 4 units)', 'Balance Sheet', 'Paid Off',
 '2025-05-23', '2026-05-22', 12, 385000.00, NULL, 385000.00, 385000.00, 0.00,
 0.100000, 0.00, 'Interest Only', true,
 '-', 0.000000, 3850.00, NULL, NULL, NULL, NULL, NULL,
 NULL, NULL, 781, 'Luis Velez',
 'https://drive.google.com/drive/folders/1Elv5Dnps6EShqyEdNFVFE4HTjOqDWs0R',
 NULL, 0.100000),

-- RQ-0022 (interest_rate missing in source data → NULL)
('RQ-0022', 'Michelle Jerkins', 'Brantley Ranch LLC',
 '2704 W California Ave, Ruston, LA 71270',
 'Commercial', 'Refinance', 'Multifamily (5+ units)', 'Balance Sheet', 'Paid Off',
 '2025-05-28', '2026-06-27', 13, 545400.00, NULL, 545400.00, 0.00, 0.00,
 NULL, 0.00, 'Interest Only', false,
 'Requity Income Fund', 0.011160, 10908.00, NULL, NULL, NULL, NULL, NULL,
 NULL, NULL, 680, 'Luis Velez',
 'https://drive.google.com/drive/folders/1uEy2uiiEfeJ4_jUdYhg67yk6RXFnDWi3',
 NULL, NULL),

-- RQ-0025 (DUTCH)
('RQ-0025', 'Yeico Jaramillo', 'Peninsula Property Partners LLC',
 '1509 W Comanche Ave, Tampa, FL 33603',
 'RTL', 'Purchase', 'Residential (Up to 4 units)', 'Balance Sheet', 'Paid Off',
 '2025-06-13', '2026-06-12', 12, 196000.00, NULL, 196000.00, 196000.00, 0.00,
 0.120000, 0.00, 'Interest Only', true,
 '-', 0.000000, 1960.00, NULL, NULL, NULL, NULL, NULL,
 NULL, NULL, 711, 'Luis Velez',
 'https://drive.google.com/drive/folders/1BAAXwCB6bS3Kh9ZT302tJ1kJKKPpNn83',
 0.240000, 0.120000),

-- RQ-0027
('RQ-0027', 'Edward John Stewart', 'Homes N & V LLC',
 'Plant Avenue MHP: 1212 Plant Ave #5, Lakeland, FL 33805 (5 pad park)',
 'Commercial', 'Purchase', 'MH Community', 'Balance Sheet', 'Paid Off',
 '2025-06-27', '2026-06-26', 12, 250000.00, 0.00, 250000.00, 0.00, 0.00,
 0.120000, 0.00, 'Interest Only', false,
 '-', 0.000000, 6000.00, NULL, 312500.00, 312500.00, NULL, 0.00,
 0.800000, 0.800000, 730, 'Luis Velez',
 'https://drive.google.com/drive/folders/1k0deBjzVzxB538Q3UoHF5BEzyQfz3h_V',
 0.240000, 0.120000),

-- RQ-0036 (Transactional — 0% interest)
('RQ-0036', 'Manrup Singh Sandhu', 'MSS Capital LLC',
 'Lincoln Village Mobile Home Park: C St, Neosho River, 100 Road 190, Emporia, KS 66801',
 'Transactional', 'Transactional', 'MH Community', 'Transactional', 'Paid Off',
 '2025-09-17', '2026-09-17', 12, 1500000.00, 0.00, 1500000.00, 1500000.00, 0.00,
 0.000000, 0.00, 'Interest Only', false,
 '-', 0.000000, 15000.00, NULL, NULL, NULL, 0.00, NULL,
 NULL, NULL, 788, NULL,
 'https://drive.google.com/drive/folders/1mE3c8zLQIQTPVc5QgEb_ycwx40KDURBO',
 0.000000, 0.000000),

-- RQ-0052
('RQ-0052', 'Alexander Thomas Donnolo', 'Midland County RV Park LLC',
 'Requity | Midland TX MHC Bridge Loan (Midland County RV & MH Park: 5401 East County Rd 120, Midland, TX 79706)',
 'Commercial', 'Refinance', 'MH Community', 'Balance Sheet', 'Paid Off',
 '2025-11-18', '2026-11-18', 12, 725000.00, 0.00, 725000.00, 0.00, 0.00,
 0.120000, 0.00, 'Interest Only', false,
 '-', 0.000000, 14500.00, 14500.00, NULL, 1208000.00, 1510000.00, 0.00,
 0.600166, NULL, 640, 'Luis Velez',
 'https://drive.google.com/drive/u/0/folders/1mXsFb7AIioFCGd4pChG-U8pwXSW9nwxR',
 0.240000, 0.120000);


-- ---------------------------------------------------------------------------
-- LOANS — Sold (10 loans)
-- ---------------------------------------------------------------------------

INSERT INTO servicing_loans (loan_id, borrower_name, entity_name, property_address, loan_type, loan_purpose, asset_class, program, loan_status, origination_date, maturity_date, term_months, total_loan_amount, construction_holdback, funds_released, current_balance, draw_funds_available, interest_rate, monthly_payment, payment_type, dutch_interest, fund_name, fund_ownership_pct, origination_fee, exit_fee, purchase_price, origination_value, stabilized_value, additional_collateral_value, ltv_origination, ltc, borrower_credit_score, originator, folder_link, default_rate, effective_rate)
VALUES
-- RQ-0019 (DUTCH — interest rate "10% (Sold Note)" → 0.10)
('RQ-0019', 'Roberto Reyes', 'DBJ Land Trust',
 '560 NW 188 St, Miami Gardens, FL 33169',
 'RTL', 'Purchase', 'Residential (Up to 4 units)', 'Balance Sheet', 'Sold',
 '2025-05-12', '2026-05-11', 12, 328000.00, 40000.00, 288000.00, 0.00, 40000.00,
 0.100000, 0.00, 'Interest Only', true,
 '-', 0.000000, 3280.00, NULL, 335000.00, 335000.00, 468000.00, 0.00,
 0.859701, 0.874667, 781, 'Luis Velez',
 'https://drive.google.com/drive/folders/1nWS_p89Hn-tFZW7jfXYza5GXkKlbsMN1',
 NULL, 0.100000),

-- RQ-0034 (DSCR)
('RQ-0034', 'Ben Eastman', 'Caring RE CT LLC',
 '7310 Helen Ave, Louisville, KY 40258',
 'DSCR', 'Refinance', 'Residential (Up to 4 units)', 'DSCR', 'Sold',
 '2025-09-18', '1965-09-18', NULL, 189000.00, 0.00, 189000.00, 189000.00, 0.00,
 0.072500, 0.00, 'Interest Only', false,
 '-', 0.000000, 945.00, NULL, NULL, 252000.00, NULL, NULL,
 0.750000, NULL, 797, 'Estefania',
 'https://drive.google.com/drive/folders/1aQLikHvVmdATPBLJWSOi9qdJmSVwblNR',
 0.145000, 0.072500),

-- RQ-0035 (DSCR — interest_rate missing → NULL)
('RQ-0035', 'Ben Eastman', 'Caring RE CT LLC',
 '2574 Martin Ave, Shively, KY 40216',
 'DSCR', 'Refinance', 'Residential (Up to 4 units)', 'DSCR', 'Sold',
 '2025-09-18', '1965-09-18', NULL, 187500.00, 0.00, 187500.00, 187500.00, 0.00,
 NULL, 0.00, 'Interest Only', false,
 '-', 0.000000, 937.00, NULL, NULL, 250000.00, NULL, NULL,
 0.750000, NULL, 797, 'Estefania',
 'https://drive.google.com/drive/folders/18Jd3t4qmwi5VJtSjiPWaPZ1Qe7kG-US3',
 NULL, NULL),

-- RQ-0037 (DSCR)
('RQ-0037', 'Ben Eastman', 'STL Bruce LLC',
 '1 Bruce Dr, Florissant, MO 63031',
 'DSCR', 'Refinance', 'Multifamily (5+ units)', 'DSCR', 'Sold',
 '2025-09-16', '1965-09-16', NULL, 240380.00, 0.00, 240380.00, 240380.00, 0.00,
 0.077500, 0.00, 'Interest Only', false,
 '-', 0.000000, 2403.80, NULL, NULL, 340000.00, NULL, NULL,
 0.707000, NULL, 797, 'Estefania',
 'https://drive.google.com/drive/folders/1db7T5x6H-t1R7twIF6JMy80o41zCRgdu',
 0.155000, 0.077500),

-- RQ-0038 (DSCR)
('RQ-0038', 'Ben Eastman', 'STL Bruce LLC',
 '2 Bruce Dr, Florissant, MO 63031',
 'DSCR', 'Refinance', 'Multifamily (5+ units)', 'DSCR', 'Sold',
 '2025-09-16', '1965-09-16', NULL, 240380.00, 0.00, 240380.00, 240380.00, 0.00,
 0.077500, 0.00, 'Interest Only', false,
 '-', 0.000000, 2403.80, NULL, NULL, 340000.00, NULL, NULL,
 0.707000, NULL, 797, 'Estefania',
 'https://drive.google.com/drive/folders/1qUY24ClZWKo08hYFXhHGVFl2raFiVJUR',
 0.155000, 0.077500),

-- RQ-0039 (DSCR — Dutch is "N/A" → false)
('RQ-0039', 'Noah Cosby', 'STL Bruce LLC',
 '3 Bruce Dr, Florissant, MO 63031',
 'DSCR', 'Refinance', 'Multifamily (5+ units)', 'DSCR', 'Sold',
 '2025-09-16', '1965-09-16', NULL, 240380.00, 0.00, 240380.00, 240380.00, 0.00,
 0.077500, 0.00, 'Interest Only', false,
 '-', 0.000000, 2403.80, NULL, NULL, 340000.00, NULL, NULL,
 0.707000, NULL, 819, 'Estefania',
 'https://drive.google.com/drive/folders/1pFc7ej8PVPOmMzD_O_9PrlcKEnoTFlqc',
 0.155000, 0.077500),

-- RQ-0040 (DSCR — Dutch is "N/A" → false)
('RQ-0040', 'Walter Cardona', 'JAXMEX LLC',
 '3675 Nicholas Circle S, Jacksonville, FL 32207',
 'DSCR', 'Refinance', 'Residential (Up to 4 units)', 'DSCR', 'Sold',
 '2025-09-30', '1955-09-30', NULL, 198900.00, 0.00, 198900.00, 198900.00, 0.00,
 0.075000, 0.00, 'Interest Only', false,
 '-', 0.000000, 3978.00, NULL, NULL, 300000.00, NULL, NULL,
 0.663000, NULL, 663, 'Estefania',
 'https://drive.google.com/drive/folders/1YI7gZlzhC2bPYCtDcK5hRI2mnl2T73Wx',
 0.150000, 0.075000),

-- RQ-0041 (DSCR — Dutch is "N/A" → false)
('RQ-0041', 'Ben Eastman', 'STL Bruce LLC',
 '4505 Ash Ave, Louisville, KY 40258',
 'DSCR', 'Refinance', 'Residential (Up to 4 units)', 'DSCR', 'Sold',
 '2025-10-07', '2027-01-30', 16, 180000.00, 0.00, 180000.00, 180000.00, 0.00,
 0.070000, 0.00, 'Interest Only', false,
 '-', 0.000000, 1500.00, NULL, NULL, 240000.00, NULL, NULL,
 0.750000, NULL, 797, 'Estefania',
 'https://drive.google.com/drive/folders/1YI7gZlzhC2bPYCtDcK5hRI2mnl2T73Wx',
 0.140000, 0.070000),

-- RQ-0042 (DSCR — Dutch is "N/A" → false)
('RQ-0042', 'Ben Eastman', 'STL Bruce LLC',
 '7809 Columbine Dr, Louisville, KY 40258',
 'DSCR', 'Refinance', 'Residential (Up to 4 units)', 'DSCR', 'Sold',
 '2025-10-07', NULL, NULL, 174750.00, 0.00, 174750.00, 174750.00, 0.00,
 0.071250, 0.00, 'Interest Only', false,
 '-', 0.000000, 1500.00, NULL, NULL, 233000.00, NULL, NULL,
 0.750000, NULL, 797, 'Estefania',
 'https://drive.google.com/drive/folders/1CBYZmjQvMKKmVQzyrGEJDB1bh1_3Ak2V',
 0.142500, 0.071250),

-- RQ-0043 (DSCR — Dutch is "N/A" → false)
('RQ-0043', 'Ben Eastman', 'STL Bruce LLC',
 '7504 Gerald Ave, Louisville, KY 40258',
 'DSCR', 'Refinance', 'Residential (Up to 4 units)', 'DSCR', 'Sold',
 '2025-10-07', NULL, NULL, 150000.00, 0.00, 150000.00, 150000.00, 0.00,
 0.071250, 0.00, 'Interest Only', false,
 '-', 0.000000, 1500.00, NULL, NULL, 200000.00, NULL, NULL,
 0.750000, NULL, 797, 'Estefania',
 'https://drive.google.com/drive/folders/1nMYjQsl-6AWtPtpRbP3T9NWw04KevEtg',
 0.142500, 0.071250);


-- ---------------------------------------------------------------------------
-- DRAWS — All 35 draw records
-- ---------------------------------------------------------------------------

INSERT INTO servicing_draws (draw_number, loan_id, request_date, entity_name, line_item, amount, status, funded_date, inspection_complete)
VALUES
(1,  'RQ-0013', '2024-10-18', 'Kinsley Ranch LLC', 'Initial Disbursement', 622000.00, 'Funded', '2024-10-18', 'N/A'),
(2,  'RQ-0018', '2025-03-21', 'MIMS-IPR LLC', 'Initial Disbursement', 168000.00, 'Funded', '2025-03-21', 'N/A'),
(3,  'RQ-0021', '2025-05-23', 'City of Titusville Corp', 'Initial Disbursement', 81400.00, 'Funded', '2025-05-23', 'N/A'),
(4,  'RQ-0021', '2025-10-01', 'City of Titusville Corp', 'Draw 2', 34000.00, 'Funded', '2025-10-01', 'N/A'),
(5,  'RQ-0023', '2025-05-27', 'Eureka Schoolhouse LLC', 'Initial Disbursement', 165000.00, 'Funded', '2025-05-27', 'N/A'),
(6,  'RQ-0024', '2025-06-04', 'M&O Florida Investments LLC', 'Initial Disbursement', 166200.00, 'Funded', '2025-06-04', 'N/A'),
(7,  'RQ-0024', '2025-07-03', 'M&O Florida Investments LLC', 'Draw 2', 22180.00, 'Funded', '2025-07-03', 'N/A'),
(8,  'RQ-0024', '2025-08-26', 'M&O Florida Investments LLC', 'Draw 3', 9620.00, 'Funded', '2025-08-26', 'N/A'),
(9,  'RQ-0026', '2025-06-26', 'I & B Building Dreams LLC', 'Initial Disbursement', 78000.00, 'Funded', '2025-06-26', 'N/A'),
(10, 'RQ-0026', '2025-09-09', 'I & B Building Dreams LLC', 'Draw 2', 55200.00, 'Funded', '2025-09-09', 'N/A'),
(11, 'RQ-0028', '2025-06-17', 'Ranchwood Estates LLC', 'Initial Disbursement', 500000.00, 'Funded', '2025-06-17', 'N/A'),
(12, 'RQ-0029', '2025-07-25', 'RH Projects Corp', 'Initial Disbursement', 118000.00, 'Funded', '2025-07-25', 'N/A'),
(13, 'RQ-0029', '2025-11-04', 'RH Projects Corp', 'Draw 2', 50000.00, 'Funded', '2025-11-04', 'N/A'),
(14, 'RQ-0030', '2025-07-25', 'LEM RE Services LLC', 'Initial Disbursement', 115000.00, 'Funded', '2025-07-25', 'N/A'),
(15, 'RQ-0030', '2025-10-17', 'LEM RE Services LLC', 'Draw 2', 30730.00, 'Funded', '2025-10-17', 'N/A'),
(16, 'RQ-0030', '2026-01-07', 'LEM RE Services LLC', 'Draw 3', 4270.00, 'Funded', '2026-01-07', 'N/A'),
(17, 'RQ-0031', '2025-08-28', 'CAPITALNEST PROPERTIES LLC and NCA PROPERTY HOMES LLC', 'Initial Disbursement', 45000.00, 'Funded', '2025-08-28', 'N/A'),
(18, 'RQ-0031', '2025-10-02', 'CAPITALNEST PROPERTIES LLC and NCA PROPERTY HOMES LLC', 'Draw 2', 22500.00, 'Funded', '2025-10-02', 'N/A'),
(19, 'RQ-0031', '2026-01-13', 'CAPITALNEST PROPERTIES LLC and NCA PROPERTY HOMES LLC', 'Draw 3', 15000.00, 'Funded', '2026-01-13', 'N/A'),
(20, 'RQ-0031', '2026-01-29', 'CAPITALNEST PROPERTIES LLC and NCA PROPERTY HOMES LLC', 'Draw 4', 7500.00, 'Funded', '2026-01-29', 'N/A'),
(21, 'RQ-0032', '2025-08-29', 'Walnut Grove MHP LLC', 'Initial Disbursement', 700000.00, 'Funded', '2025-08-29', 'N/A'),
(22, 'RQ-0033', '2025-09-05', 'Wood and Stone RE Holdings LLC', 'Initial Disbursement', 274000.00, 'Funded', '2025-09-05', 'N/A'),
(23, 'RQ-0047', '2025-10-29', 'MI03 Property LLC', 'Initial Disbursement', 300000.00, 'Funded', '2025-10-29', 'N/A'),
(24, 'RQ-0048', '2025-10-31', 'Next Summit Ventures LLC', 'Initial Disbursement', 450000.00, 'Funded', '2025-10-31', 'N/A'),
(25, 'RQ-0051', '2025-11-18', 'RIO Team Inc', 'Initial Disbursement', 160000.00, 'Funded', '2025-11-18', 'N/A'),
(26, 'RQ-0051', '2025-12-12', 'RIO Team Inc', 'Draw 2', 25000.00, 'Funded', '2025-12-12', 'N/A'),
(27, 'RQ-0053', '2025-11-21', 'Woodlux Cabinets LLC', 'Initial Disbursement', 304000.00, 'Funded', '2025-11-21', 'N/A'),
(28, 'RQ-0054', '2025-11-21', 'David Bleke LLC', 'Initial Disbursement', 225000.00, 'Funded', '2025-11-21', 'N/A'),
(29, 'RQ-0059', '2025-12-16', 'The Prine Group LLC', 'Initial Disbursement', 310000.00, 'Funded', '2025-12-16', 'N/A'),
(30, 'RQ-0061', '2026-01-09', 'Clarksville Estates MHP LLC', 'Initial Disbursement', 297500.00, 'Funded', '2026-01-09', 'N/A'),
(31, 'RQ-0062', '2026-01-26', 'A-Z Estates of Island Creek LLC', 'Initial Disbursement', 1300000.00, 'Funded', '2026-01-26', 'N/A'),
(32, 'RQ-0063', '2026-01-26', 'TyBella Estates LLC and Balanced Health By Sara LLC', 'Initial Disbursement', 250000.00, 'Funded', '2026-01-26', 'N/A'),
(33, 'RQ-0070', '2026-02-02', 'Woodlux Cabinets LLC', 'Initial Disbursement', 331500.00, 'Funded', '2026-02-02', 'N/A'),
(34, 'RQ-0071', '2026-02-11', 'RIO Team Inc', 'Initial Disbursement', 570000.00, 'Funded', '2026-02-11', 'N/A'),
(35, 'RQ-0072', '2026-02-12', 'Lakeland MHP LLC', 'Initial Disbursement', 290000.00, 'Funded', '2026-02-12', 'N/A');


-- ---------------------------------------------------------------------------
-- PAYMENTS — 6 payment ledger records
-- ---------------------------------------------------------------------------

INSERT INTO servicing_payments (date, loan_id, borrower, type, amount_due, amount_paid, principal, interest, late_fee, balance_after, payment_method, reference_trace, entry_type, entered_by, entry_timestamp, locked, running_balance_check)
VALUES
('2026-02-01', 'RQ-0061', 'Clarksville Estates MHP LLC', 'Monthly Payment',
 2975.00, 2975.00, 0.00, 2975.00, 0.00, 297500.00,
 'ACH', 'BATCH-20260201', 'Original', 'System Import', '2026-02-24 10:00:00+00', true, 2975.00);

-- Note: The sample payments for RQ-2026-001 through RQ-2026-004 reference loan IDs
-- that don't exist in the loan tape. These appear to be test/placeholder data.
-- Storing them with synthetic loan records (status='Test') to preserve the data
-- without polluting active loan metrics.

INSERT INTO servicing_loans (loan_id, borrower_name, loan_status, total_loan_amount, current_balance, interest_rate, dutch_interest)
VALUES
('RQ-2026-001', 'John Smith', 'Test', 350000.00, 350000.00, 0.090000, false),
('RQ-2026-002', 'Jane Doe', 'Test', 275000.00, 275000.00, 0.120000, false),
('RQ-2026-003', 'Mike Johnson', 'Test', 425000.00, 425000.00, 0.090000, false),
('RQ-2026-004', 'Sarah Williams', 'Test', 200000.00, 200000.00, 0.120000, false);

INSERT INTO servicing_payments (date, loan_id, borrower, type, amount_due, amount_paid, principal, interest, late_fee, balance_after, payment_method, reference_trace, entry_type, entered_by, entry_timestamp, locked, running_balance_check)
VALUES
('2026-02-01', 'RQ-2026-001', 'John Smith', 'Monthly Payment',
 2625.00, 2625.00, 0.00, 2625.00, 0.00, 350000.00,
 'ACH', 'NACHA-20260201-001', 'Original', 'System Import', '2026-02-24 10:00:00+00', true, 2625.00),

('2026-02-01', 'RQ-2026-002', 'Jane Doe', 'Monthly Payment',
 2750.00, 2750.00, 0.00, 2750.00, 0.00, 275000.00,
 'ACH', 'NACHA-20260201-002', 'Original', 'System Import', '2026-02-24 10:00:00+00', true, 2750.00),

('2026-02-01', 'RQ-2026-003', 'Mike Johnson', 'Monthly Payment',
 3187.50, 3187.50, 0.00, 3187.50, 0.00, 425000.00,
 'ACH', 'NACHA-20260201-003', 'Original', 'System Import', '2026-02-24 10:00:00+00', true, 3187.50),

('2026-02-01', 'RQ-2026-004', 'Sarah Williams', 'Monthly Payment',
 2000.00, 0.00, 0.00, 0.00, 0.00, 200000.00,
 'ACH', 'NSF — payment returned', 'Original', 'System Import', '2026-02-24 10:00:00+00', true, 0.00),

('2026-02-05', 'RQ-2026-004', 'Sarah Williams', 'NSF Fee',
 50.00, 0.00, 0.00, 0.00, 50.00, 200000.00,
 NULL, 'Fee assessed', 'Original', 'System Import', '2026-02-24 10:00:00+00', true, 0.00);
