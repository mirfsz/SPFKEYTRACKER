-- KeyTracker Database Setup Script

-- Create the database if it doesn't exist
CREATE DATABASE IF NOT EXISTS keytracker;
USE keytracker;

-- Create company info table
CREATE TABLE IF NOT EXISTS COYINFO (
    coy VARCHAR(10) PRIMARY KEY,
    totalKeys INT NOT NULL DEFAULT 54
);

-- Populate COYINFO with default values
INSERT INTO COYINFO (coy, totalKeys) VALUES 
    ('ALPHA', 54),
    ('ALPHA1', 54),
    ('ALPHA2', 54),
    ('ALPHA3', 54),
    ('ALPHA4', 54),
    ('BRAVO', 54),
    ('CHARLIE', 54),
    ('DELTA', 54),
    ('ECHO', 54),
    ('FOXTROT', 54);

-- Create tables for each company
CREATE TABLE IF NOT EXISTS ALPHA1 (
    boxId INT PRIMARY KEY,
    status ENUM('True', 'False', 'Missing') NOT NULL DEFAULT 'True',
    bunkNo INT NOT NULL
);

CREATE TABLE IF NOT EXISTS ALPHA2 (
    boxId INT PRIMARY KEY,
    status ENUM('True', 'False', 'Missing') NOT NULL DEFAULT 'True',
    bunkNo INT NOT NULL
);

CREATE TABLE IF NOT EXISTS ALPHA3 (
    boxId INT PRIMARY KEY,
    status ENUM('True', 'False', 'Missing') NOT NULL DEFAULT 'True',
    bunkNo INT NOT NULL
);

CREATE TABLE IF NOT EXISTS ALPHA4 (
    boxId INT PRIMARY KEY,
    status ENUM('True', 'False', 'Missing') NOT NULL DEFAULT 'True',
    bunkNo INT NOT NULL
);

CREATE TABLE IF NOT EXISTS BRAVO (
    boxId INT PRIMARY KEY,
    status ENUM('True', 'False', 'Missing') NOT NULL DEFAULT 'True',
    bunkNo INT NOT NULL
);

CREATE TABLE IF NOT EXISTS CHARLIE (
    boxId INT PRIMARY KEY,
    status ENUM('True', 'False', 'Missing') NOT NULL DEFAULT 'True',
    bunkNo INT NOT NULL
);

CREATE TABLE IF NOT EXISTS DELTA (
    boxId INT PRIMARY KEY,
    status ENUM('True', 'False', 'Missing') NOT NULL DEFAULT 'True',
    bunkNo INT NOT NULL
);

CREATE TABLE IF NOT EXISTS ECHO (
    boxId INT PRIMARY KEY,
    status ENUM('True', 'False', 'Missing') NOT NULL DEFAULT 'True',
    bunkNo INT NOT NULL
);

CREATE TABLE IF NOT EXISTS FOXTROT (
    boxId INT PRIMARY KEY,
    status ENUM('True', 'False', 'Missing') NOT NULL DEFAULT 'True',
    bunkNo INT NOT NULL
);

-- Populate tables with initial data (1-54 keys for each company)
DELIMITER //
CREATE PROCEDURE PopulateKeys()
BEGIN
    DECLARE i INT DEFAULT 1;
    DECLARE tables VARCHAR(200) DEFAULT 'ALPHA1,ALPHA2,ALPHA3,ALPHA4,BRAVO,CHARLIE,DELTA,ECHO,FOXTROT';
    DECLARE tableName VARCHAR(20);
    DECLARE tableList VARCHAR(200);
    
    SET tableList = tables;
    
    WHILE CHAR_LENGTH(tableList) > 0 DO
        SET tableName = SUBSTRING_INDEX(tableList, ',', 1);
        SET tableList = IF(CHAR_LENGTH(tableList) > CHAR_LENGTH(tableName), 
                          SUBSTRING(tableList, CHAR_LENGTH(tableName) + 2), 
                          '');
        
        SET i = 1;
        WHILE i <= 54 DO
            SET @sql = CONCAT('INSERT IGNORE INTO ', tableName, ' (boxId, status, bunkNo) VALUES (', i, ', "True", ', i, ')');
            PREPARE stmt FROM @sql;
            EXECUTE stmt;
            DEALLOCATE PREPARE stmt;
            SET i = i + 1;
        END WHILE;
    END WHILE;
END //
DELIMITER ;

-- Execute the procedure
CALL PopulateKeys();
DROP PROCEDURE PopulateKeys;

-- Set permanently missing keys according to requirements
UPDATE ALPHA1 SET status = 'Missing' WHERE boxId IN (1, 3, 7, 12, 15);
UPDATE ALPHA2 SET status = 'Missing' WHERE boxId IN (2, 8, 11);
UPDATE ALPHA3 SET status = 'Missing' WHERE boxId IN (4, 9, 14, 22);
UPDATE ALPHA4 SET status = 'Missing' WHERE boxId IN (6, 13, 19);
UPDATE BRAVO SET status = 'Missing' WHERE boxId IN (5, 17, 23, 31);
UPDATE CHARLIE SET status = 'Missing' WHERE boxId IN (16, 25, 33);
UPDATE DELTA SET status = 'Missing' WHERE boxId IN (21, 27, 35);
UPDATE ECHO SET status = 'Missing' WHERE boxId IN (29, 37, 42);
UPDATE FOXTROT SET status = 'Missing' WHERE boxId IN (32, 39, 44, 48); 