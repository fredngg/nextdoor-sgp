-- Create postal sectors table based on Singapore's official postal system
CREATE TABLE IF NOT EXISTS postal_sectors (
  id SERIAL PRIMARY KEY,
  sector_code VARCHAR(2) NOT NULL UNIQUE,
  postal_district INTEGER NOT NULL,
  district_name VARCHAR(100) NOT NULL,
  region VARCHAR(20) NOT NULL,
  general_locations TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Insert all Singapore postal sectors
INSERT INTO postal_sectors (sector_code, postal_district, district_name, region, general_locations) VALUES
-- District 01 - Central Business District
('01', 1, 'Raffles Place / Cecil Street', 'Central', 'Raffles Place, Cecil Street, Marina Square, People''s Park'),
('02', 1, 'Raffles Place / Cecil Street', 'Central', 'Raffles Place, Cecil Street, Marina Square, People''s Park'),
('03', 1, 'Raffles Place / Cecil Street', 'Central', 'Raffles Place, Cecil Street, Marina Square, People''s Park'),
('04', 1, 'Raffles Place / Cecil Street', 'Central', 'Raffles Place, Cecil Street, Marina Square, People''s Park'),
('05', 1, 'Raffles Place / Cecil Street', 'Central', 'Raffles Place, Cecil Street, Marina Square, People''s Park'),
('06', 1, 'Raffles Place / Cecil Street', 'Central', 'Raffles Place, Cecil Street, Marina Square, People''s Park'),

-- District 02 - Tanjong Pagar
('07', 2, 'Anson Road / Tanjong Pagar', 'Central', 'Anson Road, Tanjong Pagar'),
('08', 2, 'Anson Road / Tanjong Pagar', 'Central', 'Anson Road, Tanjong Pagar'),

-- District 03 - Queenstown / Tiong Bahru
('14', 3, 'Queenstown / Tiong Bahru', 'Central', 'Queenstown, Tiong Bahru, Alexandra Road'),
('15', 3, 'Queenstown / Tiong Bahru', 'Central', 'Queenstown, Tiong Bahru, Alexandra Road'),
('16', 3, 'Queenstown / Tiong Bahru', 'Central', 'Queenstown, Tiong Bahru, Alexandra Road'),

-- District 04 - Telok Blangah / Harbourfront
('09', 4, 'Telok Blangah / Harbourfront', 'Central', 'Telok Blangah, Harbourfront, Keppel'),
('10', 4, 'Telok Blangah / Harbourfront', 'Central', 'Telok Blangah, Harbourfront, Keppel'),

-- District 05 - Pasir Panjang / Clementi
('11', 5, 'Pasir Panjang / Clementi', 'West', 'Pasir Panjang, Hong Leong Garden, Clementi New Town'),
('12', 5, 'Pasir Panjang / Clementi', 'West', 'Pasir Panjang, Hong Leong Garden, Clementi New Town'),
('13', 5, 'Pasir Panjang / Clementi', 'West', 'Pasir Panjang, Hong Leong Garden, Clementi New Town'),

-- District 06 - High Street / City Hall
('17', 6, 'High Street / City Hall', 'Central', 'High Street, City Hall, North Bridge Road'),

-- District 07 - Middle Road / Bugis
('18', 7, 'Middle Road / Bugis', 'Central', 'Middle Road, Golden Mile, Bugis, Rochor'),
('19', 7, 'Middle Road / Bugis', 'Central', 'Middle Road, Golden Mile, Bugis, Rochor'),

-- District 08 - Little India
('20', 8, 'Little India', 'Central', 'Little India, Farrer Park, Serangoon Road'),
('21', 8, 'Little India', 'Central', 'Little India, Farrer Park, Serangoon Road'),

-- District 09 - Orchard Road
('22', 9, 'Orchard Road', 'Central', 'Orchard Road, Cairnhill, River Valley'),
('23', 9, 'Orchard Road', 'Central', 'Orchard Road, Cairnhill, River Valley'),

-- District 10 - Bukit Timah / Holland
('24', 10, 'Bukit Timah / Holland', 'Central', 'Ardmore, Bukit Timah, Holland Road, Tanglin'),
('25', 10, 'Bukit Timah / Holland', 'Central', 'Ardmore, Bukit Timah, Holland Road, Tanglin'),
('26', 10, 'Bukit Timah / Holland', 'Central', 'Ardmore, Bukit Timah, Holland Road, Tanglin'),
('27', 10, 'Bukit Timah / Holland', 'Central', 'Ardmore, Bukit Timah, Holland Road, Tanglin'),

-- District 11 - Novena / Thomson
('28', 11, 'Novena / Thomson', 'Central', 'Watten Estate, Novena, Thomson, Newton'),
('29', 11, 'Novena / Thomson', 'Central', 'Watten Estate, Novena, Thomson, Newton'),
('30', 11, 'Novena / Thomson', 'Central', 'Watten Estate, Novena, Thomson, Newton'),

-- District 12 - Balestier / Toa Payoh
('31', 12, 'Balestier / Toa Payoh', 'Central', 'Balestier, Toa Payoh, Serangoon'),
('32', 12, 'Balestier / Toa Payoh', 'Central', 'Balestier, Toa Payoh, Serangoon'),
('33', 12, 'Balestier / Toa Payoh', 'Central', 'Balestier, Toa Payoh, Serangoon'),

-- District 13 - MacPherson / Potong Pasir
('34', 13, 'MacPherson / Potong Pasir', 'Central', 'MacPherson, Braddell, Potong Pasir'),
('35', 13, 'MacPherson / Potong Pasir', 'Central', 'MacPherson, Braddell, Potong Pasir'),
('36', 13, 'MacPherson / Potong Pasir', 'Central', 'MacPherson, Braddell, Potong Pasir'),
('37', 13, 'MacPherson / Potong Pasir', 'Central', 'MacPherson, Braddell, Potong Pasir'),

-- District 14 - Geylang / Eunos
('38', 14, 'Geylang / Eunos', 'East', 'Geylang, Eunos, Paya Lebar, Kembangan'),
('39', 14, 'Geylang / Eunos', 'East', 'Geylang, Eunos, Paya Lebar, Kembangan'),
('40', 14, 'Geylang / Eunos', 'East', 'Geylang, Eunos, Paya Lebar, Kembangan'),
('41', 14, 'Geylang / Eunos', 'East', 'Geylang, Eunos, Paya Lebar, Kembangan'),

-- District 15 - Katong / Marine Parade
('42', 15, 'Katong / Marine Parade', 'East', 'Katong, Joo Chiat, Amber Road, Marine Parade'),
('43', 15, 'Katong / Marine Parade', 'East', 'Katong, Joo Chiat, Amber Road, Marine Parade'),
('44', 15, 'Katong / Marine Parade', 'East', 'Katong, Joo Chiat, Amber Road, Marine Parade'),
('45', 15, 'Katong / Marine Parade', 'East', 'Katong, Joo Chiat, Amber Road, Marine Parade'),

-- District 16 - Bedok / Upper East Coast
('46', 16, 'Bedok / Upper East Coast', 'East', 'Bedok, Upper East Coast, Eastwood, Chai Chee'),
('47', 16, 'Bedok / Upper East Coast', 'East', 'Bedok, Upper East Coast, Eastwood, Chai Chee'),
('48', 16, 'Bedok / Upper East Coast', 'East', 'Bedok, Upper East Coast, Eastwood, Chai Chee'),

-- District 17 - Loyang / Changi
('49', 17, 'Loyang / Changi', 'East', 'Loyang, Changi, Flora Drive'),
('50', 17, 'Loyang / Changi', 'East', 'Loyang, Changi, Flora Drive'),
('81', 17, 'Loyang / Changi', 'East', 'Loyang, Changi, Flora Drive'),

-- District 18 - Tampines / Pasir Ris
('51', 18, 'Tampines / Pasir Ris', 'East', 'Tampines, Pasir Ris, Simei'),
('52', 18, 'Tampines / Pasir Ris', 'East', 'Tampines, Pasir Ris, Simei'),

-- District 19 - Serangoon Garden / Hougang
('53', 19, 'Serangoon Garden / Hougang', 'Northeast', 'Serangoon Garden, Hougang, Punggol, Sengkang'),
('54', 19, 'Serangoon Garden / Hougang', 'Northeast', 'Serangoon Garden, Hougang, Punggol, Sengkang'),
('55', 19, 'Serangoon Garden / Hougang', 'Northeast', 'Serangoon Garden, Hougang, Punggol, Sengkang'),
('82', 19, 'Serangoon Garden / Hougang', 'Northeast', 'Serangoon Garden, Hougang, Punggol, Sengkang'),

-- District 20 - Bishan / Ang Mo Kio
('56', 20, 'Bishan / Ang Mo Kio', 'Central', 'Bishan, Ang Mo Kio, Thomson'),
('57', 20, 'Bishan / Ang Mo Kio', 'Central', 'Bishan, Ang Mo Kio, Thomson'),

-- District 21 - Upper Bukit Timah / Clementi Park
('58', 21, 'Upper Bukit Timah / Clementi Park', 'West', 'Upper Bukit Timah, Clementi Park, Ulu Pandan'),
('59', 21, 'Upper Bukit Timah / Clementi Park', 'West', 'Upper Bukit Timah, Clementi Park, Ulu Pandan'),

-- District 22 - Jurong
('60', 22, 'Jurong', 'West', 'Jurong, Boon Lay, Tuas'),
('61', 22, 'Jurong', 'West', 'Jurong, Boon Lay, Tuas'),
('62', 22, 'Jurong', 'West', 'Jurong, Boon Lay, Tuas'),
('63', 22, 'Jurong', 'West', 'Jurong, Boon Lay, Tuas'),
('64', 22, 'Jurong', 'West', 'Jurong, Boon Lay, Tuas'),

-- District 23 - Hillview / Bukit Panjang
('65', 23, 'Hillview / Bukit Panjang', 'West', 'Hillview, Dairy Farm, Bukit Panjang, Choa Chu Kang'),
('66', 23, 'Hillview / Bukit Panjang', 'West', 'Hillview, Dairy Farm, Bukit Panjang, Choa Chu Kang'),
('67', 23, 'Hillview / Bukit Panjang', 'West', 'Hillview, Dairy Farm, Bukit Panjang, Choa Chu Kang'),
('68', 23, 'Hillview / Bukit Panjang', 'West', 'Hillview, Dairy Farm, Bukit Panjang, Choa Chu Kang'),

-- District 24 - Lim Chu Kang / Tengah
('69', 24, 'Lim Chu Kang / Tengah', 'West', 'Lim Chu Kang, Tengah'),
('70', 24, 'Lim Chu Kang / Tengah', 'West', 'Lim Chu Kang, Tengah'),
('71', 24, 'Lim Chu Kang / Tengah', 'West', 'Lim Chu Kang, Tengah'),

-- District 25 - Kranji / Woodlands
('72', 25, 'Kranji / Woodlands', 'North', 'Kranji, Woodgrove, Woodlands'),
('73', 25, 'Kranji / Woodlands', 'North', 'Kranji, Woodgrove, Woodlands'),

-- District 26 - Upper Thomson / Springleaf
('77', 26, 'Upper Thomson / Springleaf', 'Central', 'Upper Thomson, Springleaf'),
('78', 26, 'Upper Thomson / Springleaf', 'Central', 'Upper Thomson, Springleaf'),

-- District 27 - Yishun / Sembawang
('75', 27, 'Yishun / Sembawang', 'North', 'Yishun, Sembawang, Admiralty'),
('76', 27, 'Yishun / Sembawang', 'North', 'Yishun, Sembawang, Admiralty'),

-- District 28 - Seletar
('79', 28, 'Seletar', 'Northeast', 'Seletar, Yio Chu Kang'),
('80', 28, 'Seletar', 'Northeast', 'Seletar, Yio Chu Kang');

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_postal_sectors_sector_code ON postal_sectors(sector_code);
CREATE INDEX IF NOT EXISTS idx_postal_sectors_district ON postal_sectors(postal_district);
CREATE INDEX IF NOT EXISTS idx_postal_sectors_region ON postal_sectors(region);
