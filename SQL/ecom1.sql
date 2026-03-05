-- --------------------------------------------------------
-- Host:                         127.0.0.1
-- Server version:               8.4.3 - MySQL Community Server - GPL
-- Server OS:                    Win64
-- HeidiSQL Version:             12.8.0.6908
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


-- Dumping database structure for ecom1
CREATE DATABASE IF NOT EXISTS `ecom1` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `ecom1`;

-- Dumping structure for table ecom1.admin_log
CREATE TABLE IF NOT EXISTS `admin_log` (
  `id` int NOT NULL AUTO_INCREMENT,
  `adminId` int NOT NULL,
  `targetId` int NOT NULL,
  `details` text COLLATE utf8mb4_unicode_ci,
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `action` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `targetType` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FK_e5e7e0392545cfa1a15114da230` (`adminId`),
  CONSTRAINT `FK_e5e7e0392545cfa1a15114da230` FOREIGN KEY (`adminId`) REFERENCES `user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table ecom1.admin_log: ~0 rows (approximately)

-- Dumping structure for table ecom1.banner
CREATE TABLE IF NOT EXISTS `banner` (
  `id` int NOT NULL AUTO_INCREMENT,
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `imageUrl` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `isActive` tinyint NOT NULL DEFAULT '1',
  `displayOrder` int NOT NULL DEFAULT '0',
  `title` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `link` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `position` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'main',
  `order` int NOT NULL DEFAULT '0',
  `status` tinyint(1) NOT NULL DEFAULT '1',
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `image` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table ecom1.banner: ~0 rows (approximately)

-- Dumping structure for table ecom1.cart
CREATE TABLE IF NOT EXISTS `cart` (
  `id` int NOT NULL AUTO_INCREMENT,
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `orderedById` int NOT NULL,
  `cartTotal` decimal(10,2) NOT NULL DEFAULT '0.00',
  PRIMARY KEY (`id`),
  KEY `FK_4120326606eb5c327ddc6923cac` (`orderedById`),
  CONSTRAINT `FK_4120326606eb5c327ddc6923cac` FOREIGN KEY (`orderedById`) REFERENCES `user` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table ecom1.cart: ~0 rows (approximately)
INSERT INTO `cart` (`id`, `createdAt`, `updatedAt`, `orderedById`, `cartTotal`) VALUES
	(1, '2026-02-04 16:33:02.019267', '2026-02-04 22:01:08.000000', 2, 130378.00),
	(2, '2026-02-04 16:33:10.935714', '2026-02-04 16:36:56.000000', 3, 189.00),
	(3, '2026-02-04 16:51:17.532841', '2026-02-04 16:51:17.532841', 4, 0.00),
	(4, '2026-02-04 16:51:25.428114', '2026-02-04 16:51:25.428114', 1, 0.00);

-- Dumping structure for table ecom1.category
CREATE TABLE IF NOT EXISTS `category` (
  `id` int NOT NULL AUTO_INCREMENT,
  `slug` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `image` text COLLATE utf8mb4_unicode_ci,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_cb73208f151aa71cdd78f662d7` (`slug`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table ecom1.category: ~0 rows (approximately)
INSERT INTO `category` (`id`, `slug`, `name`, `image`, `createdAt`, `updatedAt`) VALUES
	(1, NULL, 'สินค้าทั่วไป', NULL, '2026-02-05 02:39:09.791', '2026-02-05 02:39:09.814'),
	(2, NULL, 'เสื้อผ้า', '{"icon":"👕"}', '2026-02-05 02:39:09.791', '2026-02-05 02:39:09.814'),
	(3, NULL, 'รองเท้าและกระเป๋า', '{"icon":"👜"}', '2026-02-05 02:39:09.791', '2026-02-05 02:39:09.814'),
	(4, NULL, 'อิเล็กทรอนิกส์', '{"icon":"📱"}', '2026-02-05 02:39:09.791', '2026-02-05 02:39:09.814'),
	(5, NULL, 'ของใช้ส่วนตัว', '{"icon":"🧴"}', '2026-02-05 02:39:09.791', '2026-02-05 02:39:09.814'),
	(6, NULL, 'เครื่องเขียน', '{"icon":"✏️"}', '2026-02-05 02:39:09.791', '2026-02-05 02:39:09.814');

-- Dumping structure for table ecom1.chat_message
CREATE TABLE IF NOT EXISTS `chat_message` (
  `id` int NOT NULL AUTO_INCREMENT,
  `senderId` int NOT NULL,
  `message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `isRead` tinyint(1) NOT NULL DEFAULT '0',
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `roomId` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'text',
  `imageUrl` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FK_a2be22c99b34156574f4e02d0a0` (`senderId`),
  CONSTRAINT `FK_a2be22c99b34156574f4e02d0a0` FOREIGN KEY (`senderId`) REFERENCES `user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table ecom1.chat_message: ~0 rows (approximately)

-- Dumping structure for table ecom1.coupon
CREATE TABLE IF NOT EXISTS `coupon` (
  `id` int NOT NULL AUTO_INCREMENT,
  `isUsed` tinyint(1) NOT NULL DEFAULT '0',
  `usedAt` datetime(3) DEFAULT NULL,
  `expiresAt` datetime(3) DEFAULT NULL,
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `userId` int NOT NULL,
  `type` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'DISCOUNT',
  `title` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `startDate` datetime DEFAULT NULL,
  `totalQuantity` int DEFAULT NULL,
  `perUserLimit` int NOT NULL DEFAULT '1',
  `usedCount` int NOT NULL DEFAULT '0',
  `targetUsers` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ALL',
  `categoryIds` text COLLATE utf8mb4_unicode_ci,
  `storeId` int DEFAULT NULL,
  `code` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `discountAmount` decimal(10,2) NOT NULL DEFAULT '0.00',
  `discountPercent` decimal(5,2) DEFAULT NULL,
  `minPurchase` decimal(10,2) DEFAULT NULL,
  `maxDiscount` decimal(10,2) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_62d3c5b0ce63a82c48e86d904b` (`code`),
  KEY `FK_5c844474407f18320b2d16f415b` (`storeId`),
  KEY `FK_03de14bf5e5b4410fced2ca9935` (`userId`),
  CONSTRAINT `FK_03de14bf5e5b4410fced2ca9935` FOREIGN KEY (`userId`) REFERENCES `user` (`id`),
  CONSTRAINT `FK_5c844474407f18320b2d16f415b` FOREIGN KEY (`storeId`) REFERENCES `store` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table ecom1.coupon: ~0 rows (approximately)
INSERT INTO `coupon` (`id`, `isUsed`, `usedAt`, `expiresAt`, `createdAt`, `updatedAt`, `userId`, `type`, `title`, `description`, `startDate`, `totalQuantity`, `perUserLimit`, `usedCount`, `targetUsers`, `categoryIds`, `storeId`, `code`, `discountAmount`, `discountPercent`, `minPurchase`, `maxDiscount`) VALUES
	(1, 0, NULL, '2026-02-05 19:44:33.546', '2026-02-04 19:44:33.548000', '2026-02-04 19:44:33.548000', 1, 'DISCOUNT', NULL, NULL, NULL, NULL, 1, 0, 'ALL', NULL, NULL, '10', 100.00, NULL, 0.00, NULL),
	(2, 0, NULL, '2026-02-05 19:48:42.663', '2026-02-04 19:48:42.667000', '2026-02-04 19:48:42.667000', 2, 'DISCOUNT', NULL, NULL, NULL, NULL, 1, 0, 'ALL', NULL, NULL, 'WELCOME2522663', 100.00, NULL, 0.00, NULL);

-- Dumping structure for table ecom1.faq
CREATE TABLE IF NOT EXISTS `faq` (
  `id` int NOT NULL AUTO_INCREMENT,
  `answer` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT '1',
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `question` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `category` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table ecom1.faq: ~0 rows (approximately)

-- Dumping structure for table ecom1.flash_sale
CREATE TABLE IF NOT EXISTS `flash_sale` (
  `id` int NOT NULL AUTO_INCREMENT,
  `startTime` datetime(3) NOT NULL,
  `endTime` datetime(3) NOT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT '1',
  `description` text COLLATE utf8mb4_unicode_ci,
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table ecom1.flash_sale: ~0 rows (approximately)

-- Dumping structure for table ecom1.flash_sale_item
CREATE TABLE IF NOT EXISTS `flash_sale_item` (
  `id` int NOT NULL AUTO_INCREMENT,
  `flashSaleId` int NOT NULL,
  `productId` int NOT NULL,
  `discountPrice` decimal(10,2) NOT NULL,
  `limitStock` int NOT NULL,
  `sold` int NOT NULL DEFAULT '0',
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `FK_f498524e801f1c1f758cb10b895` (`flashSaleId`),
  KEY `FK_e257a76363f25d2b90ccd3b7ee8` (`productId`),
  CONSTRAINT `FK_e257a76363f25d2b90ccd3b7ee8` FOREIGN KEY (`productId`) REFERENCES `product` (`id`) ON DELETE CASCADE,
  CONSTRAINT `FK_f498524e801f1c1f758cb10b895` FOREIGN KEY (`flashSaleId`) REFERENCES `flash_sale` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table ecom1.flash_sale_item: ~0 rows (approximately)

-- Dumping structure for table ecom1.image
CREATE TABLE IF NOT EXISTS `image` (
  `id` int NOT NULL AUTO_INCREMENT,
  `productId` int NOT NULL,
  `asset_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `public_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `secure_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `url` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `FK_c6eb61588205e25a848ba6105cd` (`productId`),
  CONSTRAINT `FK_c6eb61588205e25a848ba6105cd` FOREIGN KEY (`productId`) REFERENCES `product` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=41 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table ecom1.image: ~0 rows (approximately)
INSERT INTO `image` (`id`, `productId`, `asset_id`, `public_id`, `secure_url`, `url`, `updatedAt`, `createdAt`) VALUES
	(1, 1, 'seed-1-0', 'seed-1-0', 'https://picsum.photos/400/400?random=1', 'https://picsum.photos/400/400?random=1', '2026-02-05 02:39:09.904', '2026-02-05 02:42:38.818'),
	(2, 2, 'seed-2-0', 'seed-2-0', 'https://picsum.photos/400/400?random=2', 'https://picsum.photos/400/400?random=2', '2026-02-05 02:39:09.904', '2026-02-05 02:42:38.818'),
	(3, 3, 'seed-3-0', 'seed-3-0', 'https://picsum.photos/400/400?random=3', 'https://picsum.photos/400/400?random=3', '2026-02-05 02:39:09.904', '2026-02-05 02:42:38.818'),
	(4, 4, 'seed-4-0', 'seed-4-0', 'https://picsum.photos/400/400?random=4', 'https://picsum.photos/400/400?random=4', '2026-02-05 02:39:09.904', '2026-02-05 02:42:38.818'),
	(5, 5, 'seed-5-0', 'seed-5-0', 'https://picsum.photos/400/400?random=5', 'https://picsum.photos/400/400?random=5', '2026-02-05 02:39:09.904', '2026-02-05 02:42:38.818'),
	(6, 6, 'seed-6-0', 'seed-6-0', 'https://picsum.photos/400/400?random=6', 'https://picsum.photos/400/400?random=6', '2026-02-05 02:39:09.904', '2026-02-05 02:42:38.818'),
	(7, 7, 'seed-7-0', 'seed-7-0', 'https://picsum.photos/400/400?random=7', 'https://picsum.photos/400/400?random=7', '2026-02-05 02:39:09.904', '2026-02-05 02:42:38.818'),
	(8, 8, 'seed-8-0', 'seed-8-0', 'https://picsum.photos/400/400?random=8', 'https://picsum.photos/400/400?random=8', '2026-02-05 02:39:09.904', '2026-02-05 02:42:38.818'),
	(9, 9, 'seed-9-0', 'seed-9-0', 'https://picsum.photos/400/400?random=9', 'https://picsum.photos/400/400?random=9', '2026-02-05 02:39:09.904', '2026-02-05 02:42:38.818'),
	(10, 10, 'seed-10-0', 'seed-10-0', 'https://picsum.photos/400/400?random=10', 'https://picsum.photos/400/400?random=10', '2026-02-05 02:39:09.904', '2026-02-05 02:42:38.818'),
	(11, 11, 'mall-11-0', 'mall-11-0', 'https://picsum.photos/400/400?random=1011', 'https://picsum.photos/400/400?random=1011', '2026-02-05 02:39:09.904', '2026-02-05 02:42:38.818'),
	(12, 12, 'mall-12-0', 'mall-12-0', 'https://picsum.photos/400/400?random=1012', 'https://picsum.photos/400/400?random=1012', '2026-02-05 02:39:09.904', '2026-02-05 02:42:38.818'),
	(13, 13, 'mall-13-0', 'mall-13-0', 'https://picsum.photos/400/400?random=1013', 'https://picsum.photos/400/400?random=1013', '2026-02-05 02:39:09.904', '2026-02-05 02:42:38.818'),
	(14, 14, 'mall-14-0', 'mall-14-0', 'https://picsum.photos/400/400?random=1014', 'https://picsum.photos/400/400?random=1014', '2026-02-05 02:39:09.904', '2026-02-05 02:42:38.818'),
	(15, 15, 'mall-15-0', 'mall-15-0', 'https://picsum.photos/400/400?random=1015', 'https://picsum.photos/400/400?random=1015', '2026-02-05 02:39:09.904', '2026-02-05 02:42:38.818'),
	(16, 16, 'mall-16-0', 'mall-16-0', 'https://picsum.photos/400/400?random=1016', 'https://picsum.photos/400/400?random=1016', '2026-02-05 02:39:09.904', '2026-02-05 02:42:38.818'),
	(17, 17, 'mall-17-0', 'mall-17-0', 'https://picsum.photos/400/400?random=1017', 'https://picsum.photos/400/400?random=1017', '2026-02-05 02:39:09.904', '2026-02-05 02:42:38.818'),
	(18, 18, 'mall-18-0', 'mall-18-0', 'https://picsum.photos/400/400?random=1018', 'https://picsum.photos/400/400?random=1018', '2026-02-05 02:39:09.904', '2026-02-05 02:42:38.818'),
	(19, 19, 'mall-19-0', 'mall-19-0', 'https://picsum.photos/400/400?random=1019', 'https://picsum.photos/400/400?random=1019', '2026-02-05 02:39:09.904', '2026-02-05 02:42:38.818'),
	(20, 20, 'mall-20-0', 'mall-20-0', 'https://picsum.photos/400/400?random=1020', 'https://picsum.photos/400/400?random=1020', '2026-02-05 02:39:09.904', '2026-02-05 02:42:38.818'),
	(21, 21, 'mall-21-0', 'mall-21-0', 'https://picsum.photos/400/400?random=1021', 'https://picsum.photos/400/400?random=1021', '2026-02-05 02:39:09.904', '2026-02-05 02:42:38.818'),
	(22, 22, 'mall-22-0', 'mall-22-0', 'https://picsum.photos/400/400?random=1022', 'https://picsum.photos/400/400?random=1022', '2026-02-05 02:39:09.904', '2026-02-05 02:42:38.818'),
	(23, 23, 'mall-23-0', 'mall-23-0', 'https://picsum.photos/400/400?random=1023', 'https://picsum.photos/400/400?random=1023', '2026-02-05 02:39:09.904', '2026-02-05 02:42:38.818'),
	(24, 24, 'mall-24-0', 'mall-24-0', 'https://picsum.photos/400/400?random=1024', 'https://picsum.photos/400/400?random=1024', '2026-02-05 02:39:09.904', '2026-02-05 02:42:38.818'),
	(25, 25, 'mall-25-0', 'mall-25-0', 'https://picsum.photos/400/400?random=1025', 'https://picsum.photos/400/400?random=1025', '2026-02-05 02:39:09.904', '2026-02-05 02:42:38.818'),
	(26, 26, 'mall-26-0', 'mall-26-0', 'https://picsum.photos/400/400?random=1026', 'https://picsum.photos/400/400?random=1026', '2026-02-05 02:39:09.904', '2026-02-05 02:42:38.818'),
	(27, 27, 'mall-27-0', 'mall-27-0', 'https://picsum.photos/400/400?random=1027', 'https://picsum.photos/400/400?random=1027', '2026-02-05 02:39:09.904', '2026-02-05 02:42:38.818'),
	(28, 28, 'mall-28-0', 'mall-28-0', 'https://picsum.photos/400/400?random=1028', 'https://picsum.photos/400/400?random=1028', '2026-02-05 02:39:09.904', '2026-02-05 02:42:38.818'),
	(29, 29, 'mall-29-0', 'mall-29-0', 'https://picsum.photos/400/400?random=1029', 'https://picsum.photos/400/400?random=1029', '2026-02-05 02:39:09.904', '2026-02-05 02:42:38.818'),
	(30, 30, 'mall-30-0', 'mall-30-0', 'https://picsum.photos/400/400?random=1030', 'https://picsum.photos/400/400?random=1030', '2026-02-05 02:39:09.904', '2026-02-05 02:42:38.818'),
	(31, 31, 'mall-31-0', 'mall-31-0', 'https://picsum.photos/400/400?random=1031', 'https://picsum.photos/400/400?random=1031', '2026-02-05 02:39:09.904', '2026-02-05 02:42:38.818'),
	(32, 32, 'mall-32-0', 'mall-32-0', 'https://picsum.photos/400/400?random=1032', 'https://picsum.photos/400/400?random=1032', '2026-02-05 02:39:09.904', '2026-02-05 02:42:38.818'),
	(33, 33, 'mall-33-0', 'mall-33-0', 'https://picsum.photos/400/400?random=1033', 'https://picsum.photos/400/400?random=1033', '2026-02-05 02:39:09.904', '2026-02-05 02:42:38.818'),
	(34, 34, 'mall-34-0', 'mall-34-0', 'https://picsum.photos/400/400?random=1034', 'https://picsum.photos/400/400?random=1034', '2026-02-05 02:39:09.904', '2026-02-05 02:42:38.818'),
	(35, 35, 'mall-35-0', 'mall-35-0', 'https://picsum.photos/400/400?random=1035', 'https://picsum.photos/400/400?random=1035', '2026-02-05 02:39:09.904', '2026-02-05 02:42:38.818'),
	(36, 36, 'mall-36-0', 'mall-36-0', 'https://picsum.photos/400/400?random=1036', 'https://picsum.photos/400/400?random=1036', '2026-02-05 02:39:09.904', '2026-02-05 02:42:38.818'),
	(37, 37, 'mall-37-0', 'mall-37-0', 'https://picsum.photos/400/400?random=1037', 'https://picsum.photos/400/400?random=1037', '2026-02-05 02:39:09.904', '2026-02-05 02:42:38.818'),
	(38, 38, 'mall-38-0', 'mall-38-0', 'https://picsum.photos/400/400?random=1038', 'https://picsum.photos/400/400?random=1038', '2026-02-05 02:39:09.904', '2026-02-05 02:42:38.818'),
	(39, 39, 'mall-39-0', 'mall-39-0', 'https://picsum.photos/400/400?random=1039', 'https://picsum.photos/400/400?random=1039', '2026-02-05 02:39:09.904', '2026-02-05 02:42:38.818'),
	(40, 40, 'mall-40-0', 'mall-40-0', 'https://picsum.photos/400/400?random=1040', 'https://picsum.photos/400/400?random=1040', '2026-02-05 02:39:09.904', '2026-02-05 02:42:38.818');

-- Dumping structure for table ecom1.notification
CREATE TABLE IF NOT EXISTS `notification` (
  `id` int NOT NULL AUTO_INCREMENT,
  `isRead` tinyint(1) NOT NULL DEFAULT '0',
  `userId` int NOT NULL,
  `data` text COLLATE utf8mb4_unicode_ci,
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `body` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `message` varchar(2000) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `targetRole` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `orderId` int DEFAULT NULL,
  `paymentId` int DEFAULT NULL,
  `productId` int DEFAULT NULL,
  `storeId` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FK_1ced25315eb974b73391fb1c81b` (`userId`),
  CONSTRAINT `FK_1ced25315eb974b73391fb1c81b` FOREIGN KEY (`userId`) REFERENCES `user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table ecom1.notification: ~0 rows (approximately)

-- Dumping structure for table ecom1.notification_setting
CREATE TABLE IF NOT EXISTS `notification_setting` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `orderUpdate` tinyint(1) NOT NULL DEFAULT '1',
  `promotion` tinyint(1) NOT NULL DEFAULT '1',
  `chat` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `REL_3480ded3271e72f04ecb8353ad` (`userId`),
  CONSTRAINT `FK_3480ded3271e72f04ecb8353ad1` FOREIGN KEY (`userId`) REFERENCES `user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table ecom1.notification_setting: ~0 rows (approximately)

-- Dumping structure for table ecom1.order
CREATE TABLE IF NOT EXISTS `order` (
  `id` int NOT NULL AUTO_INCREMENT,
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `orderedById` int NOT NULL,
  `couponId` int DEFAULT NULL,
  `orderStatus` enum('PENDING','VERIFYING','PENDING_CONFIRMATION','PROCESSING','READY_FOR_PICKUP','RIDER_ASSIGNED','PICKED_UP','SHIPPED','OUT_FOR_DELIVERY','DELIVERED','COMPLETED','CANCELLED','CANCELLATION_REQUESTED','REFUND_REQUESTED','REFUNDED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `refundStatus` enum('NONE','PENDING','REQUESTED','APPROVED','REJECTED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'NONE',
  `refundReason` text COLLATE utf8mb4_unicode_ci,
  `refundSlipUrl` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `refundDate` datetime DEFAULT NULL,
  `paymentMethod` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT 'STRIPE',
  `paymentExpiredAt` datetime DEFAULT NULL,
  `paymentSlipUrl` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `slipReference` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `trackingNumber` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `logisticsProvider` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `receivedAt` datetime DEFAULT NULL,
  `confirmationDeadline` datetime DEFAULT NULL,
  `isAutoCancelled` tinyint NOT NULL DEFAULT '0',
  `cartTotal` decimal(10,2) NOT NULL,
  `shippingAddress` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `shippingPhone` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `discountAmount` decimal(10,2) NOT NULL DEFAULT '0.00',
  `discountCode` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `oderStatus` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Not Process',
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_order_payment_slip_url_permanent` (`paymentSlipUrl`),
  UNIQUE KEY `idx_order_slip_reference_permanent` (`slipReference`),
  KEY `FK_55a19832ba4b85f23fa01b0fd97` (`orderedById`),
  KEY `FK_8e2b018ed0091fa11714dd7b3e1` (`couponId`),
  CONSTRAINT `FK_55a19832ba4b85f23fa01b0fd97` FOREIGN KEY (`orderedById`) REFERENCES `user` (`id`),
  CONSTRAINT `FK_8e2b018ed0091fa11714dd7b3e1` FOREIGN KEY (`couponId`) REFERENCES `coupon` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table ecom1.order: ~0 rows (approximately)

-- Dumping structure for table ecom1.order_returns
CREATE TABLE IF NOT EXISTS `order_returns` (
  `id` int NOT NULL AUTO_INCREMENT,
  `orderId` int NOT NULL,
  `userId` int NOT NULL,
  `images` text COLLATE utf8mb4_unicode_ci,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `reason_code` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reason_text` text COLLATE utf8mb4_unicode_ci,
  `refund_amount` decimal(10,2) DEFAULT NULL,
  `admin_note` text COLLATE utf8mb4_unicode_ci,
  `resolved_at` datetime DEFAULT NULL,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'REQUESTED',
  PRIMARY KEY (`id`),
  KEY `FK_f39d146182acafd27e1095ae940` (`orderId`),
  KEY `FK_8289d233ec971ec437445c5da13` (`userId`),
  CONSTRAINT `FK_8289d233ec971ec437445c5da13` FOREIGN KEY (`userId`) REFERENCES `user` (`id`) ON DELETE CASCADE,
  CONSTRAINT `FK_f39d146182acafd27e1095ae940` FOREIGN KEY (`orderId`) REFERENCES `order` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table ecom1.order_returns: ~0 rows (approximately)

-- Dumping structure for table ecom1.order_return_items
CREATE TABLE IF NOT EXISTS `order_return_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `orderReturnId` int NOT NULL,
  `orderItemId` int NOT NULL,
  `quantity` int NOT NULL,
  `unitPrice` decimal(10,2) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FK_7ac97d9013414c0faa4cf201370` (`orderReturnId`),
  KEY `FK_279feafa212e034ad752b85310f` (`orderItemId`),
  CONSTRAINT `FK_279feafa212e034ad752b85310f` FOREIGN KEY (`orderItemId`) REFERENCES `productonorder` (`id`) ON DELETE CASCADE,
  CONSTRAINT `FK_7ac97d9013414c0faa4cf201370` FOREIGN KEY (`orderReturnId`) REFERENCES `order_returns` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table ecom1.order_return_items: ~0 rows (approximately)

-- Dumping structure for table ecom1.payment
CREATE TABLE IF NOT EXISTS `payment` (
  `id` int NOT NULL AUTO_INCREMENT,
  `amount` double NOT NULL,
  `currency` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'THB',
  `method` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `customerEmail` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `customerName` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `customerPhone` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `transactionId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `gatewayId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `gatewayStatus` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `metadata` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `qrCodeData` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `paymentSlipUrl` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `approvedBy` int DEFAULT NULL,
  `approvedAt` datetime(3) DEFAULT NULL,
  `rejectedBy` int DEFAULT NULL,
  `rejectedAt` datetime(3) DEFAULT NULL,
  `rejectionReason` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  `orderId` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `payment_transactionId_key` (`transactionId`),
  KEY `payment_orderId_idx` (`orderId`),
  CONSTRAINT `payment_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `order` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table ecom1.payment: ~0 rows (approximately)

-- Dumping structure for table ecom1.product
CREATE TABLE IF NOT EXISTS `product` (
  `id` int NOT NULL AUTO_INCREMENT,
  `description` text COLLATE utf8mb4_unicode_ci,
  `discountStartDate` datetime(3) DEFAULT NULL,
  `discountEndDate` datetime(3) DEFAULT NULL,
  `sold` int NOT NULL DEFAULT '0',
  `quantity` int NOT NULL,
  `categoryId` int NOT NULL,
  `storeId` int DEFAULT NULL,
  `subcategoryId` int DEFAULT NULL,
  `slug` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `isActive` tinyint NOT NULL DEFAULT '1',
  `subcategory` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `discountPrice` decimal(10,2) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `sku` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_8cfaf4a1e80806d58e3dbe6922` (`slug`),
  KEY `FK_ff0c0301a95e517153df97f6812` (`categoryId`),
  KEY `FK_32eaa54ad96b26459158464379a` (`storeId`),
  KEY `FK_904b30d0611df66f73164e999db` (`subcategoryId`),
  CONSTRAINT `FK_32eaa54ad96b26459158464379a` FOREIGN KEY (`storeId`) REFERENCES `store` (`id`),
  CONSTRAINT `FK_904b30d0611df66f73164e999db` FOREIGN KEY (`subcategoryId`) REFERENCES `subcategory` (`id`),
  CONSTRAINT `FK_ff0c0301a95e517153df97f6812` FOREIGN KEY (`categoryId`) REFERENCES `category` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=41 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table ecom1.product: ~0 rows (approximately)
INSERT INTO `product` (`id`, `description`, `discountStartDate`, `discountEndDate`, `sold`, `quantity`, `categoryId`, `storeId`, `subcategoryId`, `slug`, `isActive`, `subcategory`, `title`, `price`, `discountPrice`, `createdAt`, `updatedAt`, `sku`) VALUES
	(1, 'รายละเอียดสินค้า: เสื้อยืดคอกลม Cotton 100% สีขาว. คุณภาพดี ราคาพิเศษ', NULL, NULL, 0, 158, 2, 1, 1, 'cotton-100percent-ml7u2gbx-0', 1, NULL, 'เสื้อยืดคอกลม Cotton 100% สีขาว', 299.00, NULL, '2026-02-05 02:39:09.836', '2026-02-05 02:39:09.873', NULL),
	(2, 'รายละเอียดสินค้า: กางเกงยีนส์ขายาว สไตล์สลิมฟิต. คุณภาพดี ราคาพิเศษ', NULL, NULL, 0, 157, 2, 1, 2, 'product-ml7u2gc6-1', 1, NULL, 'กางเกงยีนส์ขายาว สไตล์สลิมฟิต', 899.00, NULL, '2026-02-05 02:39:09.836', '2026-02-05 02:39:09.873', NULL),
	(3, 'รายละเอียดสินค้า: รองเท้าผ้าใบ Unisex สีดำ. คุณภาพดี ราคาพิเศษ', NULL, NULL, 0, 140, 3, 1, 4, 'unisex-ml7u2gce-2', 1, NULL, 'รองเท้าผ้าใบ Unisex สีดำ', 599.00, NULL, '2026-02-05 02:39:09.836', '2026-02-05 02:39:09.873', NULL),
	(4, 'รายละเอียดสินค้า: กระเป๋าสะพายหนัง PU ขนาดกลาง. คุณภาพดี ราคาพิเศษ', NULL, NULL, 0, 165, 3, 1, 5, 'pu-ml7u2gcl-3', 1, NULL, 'กระเป๋าสะพายหนัง PU ขนาดกลาง', 449.00, NULL, '2026-02-05 02:39:09.836', '2026-02-05 02:39:09.873', NULL),
	(5, 'รายละเอียดสินค้า: นาฬิกาข้อมือดิจิทัล กันน้ำ. คุณภาพดี ราคาพิเศษ', NULL, NULL, 0, 143, 4, 1, 8, 'product-ml7u2gcs-4', 1, NULL, 'นาฬิกาข้อมือดิจิทัล กันน้ำ', 1299.00, NULL, '2026-02-05 02:39:09.836', '2026-02-05 02:39:09.873', NULL),
	(6, 'รายละเอียดสินค้า: หูฟังบลูทูธไร้สาย น้ำหนักเบา. คุณภาพดี ราคาพิเศษ', NULL, NULL, 0, 147, 4, 1, 7, 'product-ml7u2gcz-5', 1, NULL, 'หูฟังบลูทูธไร้สาย น้ำหนักเบา', 699.00, NULL, '2026-02-05 02:39:09.836', '2026-02-05 02:39:09.873', NULL),
	(7, 'รายละเอียดสินค้า: กระบอกน้ำสแตนเลส 500ml เก็บความเย็น. คุณภาพดี ราคาพิเศษ', NULL, NULL, 0, 171, 5, 1, 10, '500ml-ml7u2gdg-6', 1, NULL, 'กระบอกน้ำสแตนเลส 500ml เก็บความเย็น', 349.00, NULL, '2026-02-05 02:39:09.836', '2026-02-05 02:39:09.873', NULL),
	(8, 'รายละเอียดสินค้า: หมวกแก๊ปกันแดด ผ้าคอตตอน. คุณภาพดี ราคาพิเศษ', NULL, NULL, 0, 165, 5, 1, 11, 'product-ml7u2gdn-7', 1, NULL, 'หมวกแก๊ปกันแดด ผ้าคอตตอน', 199.00, NULL, '2026-02-05 02:39:09.836', '2026-02-05 02:39:09.873', NULL),
	(9, 'รายละเอียดสินค้า: สายคล้องมือถือแบบสวมคอ. คุณภาพดี ราคาพิเศษ', NULL, NULL, 0, 151, 5, 1, 12, 'product-ml7u2gdu-8', 1, NULL, 'สายคล้องมือถือแบบสวมคอ', 149.00, NULL, '2026-02-05 02:39:09.836', '2026-02-05 02:39:09.873', NULL),
	(10, 'รายละเอียดสินค้า: ชุดเครื่องเขียน 6 ชิ้น สำหรับนักเรียน. คุณภาพดี ราคาพิเศษ', NULL, NULL, 0, 146, 6, 1, 13, '6-ml7u2ge0-9', 1, NULL, 'ชุดเครื่องเขียน 6 ชิ้น สำหรับนักเรียน', 189.00, NULL, '2026-02-05 02:39:09.836', '2026-02-05 02:39:09.873', NULL),
	(11, '[Mall] iPhone 15 Pro Max 256GB สีเทา. สินค้าแบรนด์เนม รับประกันของแท้', NULL, NULL, 0, 15, 4, 2, 7, 'iphone-15-pro-max-256gb-mall-ml7uki5m-0', 1, NULL, 'iPhone 15 Pro Max 256GB สีเทา', 42900.00, NULL, '2026-02-05 02:39:09.836', '2026-02-05 02:39:09.873', 'MALL-0011-1'),
	(12, '[Mall] MacBook Air M3 13 นิ้ว. สินค้าแบรนด์เนม รับประกันของแท้', NULL, NULL, 0, 10, 4, 2, 7, 'macbook-air-m3-13-mall-ml7uki5w-1', 1, NULL, 'MacBook Air M3 13 นิ้ว', 35900.00, NULL, '2026-02-05 02:39:09.836', '2026-02-05 02:39:09.873', NULL),
	(13, '[Mall] AirPods Pro 2 รุ่นล่าสุด. สินค้าแบรนด์เนม รับประกันของแท้', NULL, NULL, 0, 30, 4, 2, 7, 'airpods-pro-2-mall-ml7uki62-2', 1, NULL, 'AirPods Pro 2 รุ่นล่าสุด', 7990.00, NULL, '2026-02-05 02:39:09.836', '2026-02-05 02:39:09.873', NULL),
	(14, '[Mall] iPad Air 10.9 นิ้ว Wi-Fi 64GB. สินค้าแบรนด์เนม รับประกันของแท้', NULL, NULL, 0, 20, 4, 2, 7, 'ipad-air-109-wi-fi-64gb-mall-ml7uki6f-3', 1, NULL, 'iPad Air 10.9 นิ้ว Wi-Fi 64GB', 19900.00, NULL, '2026-02-05 02:39:09.836', '2026-02-05 02:39:09.873', NULL),
	(15, '[Mall] Apple Watch Series 9 GPS 41mm. สินค้าแบรนด์เนม รับประกันของแท้', NULL, NULL, 0, 25, 4, 2, 7, 'apple-watch-series-9-gps-41mm-mall-ml7uki6n-4', 1, NULL, 'Apple Watch Series 9 GPS 41mm', 12900.00, NULL, '2026-02-05 02:39:09.836', '2026-02-05 02:39:09.873', NULL),
	(16, '[Mall] Samsung Galaxy S24 Ultra 512GB. สินค้าแบรนด์เนม รับประกันของแท้', NULL, NULL, 0, 12, 4, 2, 7, 'samsung-galaxy-s24-ultra-512gb-mall-ml7uki6t-5', 1, NULL, 'Samsung Galaxy S24 Ultra 512GB', 44900.00, NULL, '2026-02-05 02:39:09.836', '2026-02-05 02:39:09.873', NULL),
	(17, '[Mall] Sony WH-1000XM5 หูฟังไร้สาย. สินค้าแบรนด์เนม รับประกันของแท้', NULL, NULL, 0, 18, 4, 2, 7, 'sony-wh-1000xm5-mall-ml7uki70-6', 1, NULL, 'Sony WH-1000XM5 หูฟังไร้สาย', 11990.00, NULL, '2026-02-05 02:39:09.836', '2026-02-05 02:39:09.873', NULL),
	(18, '[Mall] Dyson V15 Detect สายรุ่นล่าสุด. สินค้าแบรนด์เนม รับประกันของแท้', NULL, NULL, 0, 8, 4, 2, 7, 'dyson-v15-detect-mall-ml7uki76-7', 1, NULL, 'Dyson V15 Detect สายรุ่นล่าสุด', 24900.00, NULL, '2026-02-05 02:39:09.836', '2026-02-05 02:39:09.873', NULL),
	(19, '[Mall] Nintendo Switch OLED. สินค้าแบรนด์เนม รับประกันของแท้', NULL, NULL, 0, 22, 4, 2, 7, 'nintendo-switch-oled-mall-ml7uki7d-8', 1, NULL, 'Nintendo Switch OLED', 12990.00, NULL, '2026-02-05 02:39:09.836', '2026-02-05 02:39:09.873', NULL),
	(20, '[Mall] Kindle Paperwhite 11th Gen. สินค้าแบรนด์เนม รับประกันของแท้', NULL, NULL, 0, 35, 4, 2, 7, 'kindle-paperwhite-11th-gen-mall-ml7uki7j-9', 1, NULL, 'Kindle Paperwhite 11th Gen', 5990.00, NULL, '2026-02-05 02:39:09.836', '2026-02-05 02:39:09.873', NULL),
	(21, '[Mall] iPhone 15 Pro Max 256GB สีเทา. สินค้าแบรนด์เนม รับประกันของแท้', NULL, NULL, 0, 15, 4, 2, 7, 'iphone-15-pro-max-256gb-mall-ml8517pn-0', 1, NULL, 'iPhone 15 Pro Max 256GB สีเทา', 42900.00, NULL, '2026-02-05 02:39:09.836', '2026-02-05 02:39:09.873', 'MALL-0021-1'),
	(22, '[Mall] MacBook Air M3 13 นิ้ว. สินค้าแบรนด์เนม รับประกันของแท้', NULL, NULL, 0, 10, 4, 2, 7, 'macbook-air-m3-13-mall-ml8517py-1', 1, NULL, 'MacBook Air M3 13 นิ้ว', 35900.00, NULL, '2026-02-05 02:39:09.836', '2026-02-05 02:39:09.873', NULL),
	(23, '[Mall] AirPods Pro 2 รุ่นล่าสุด. สินค้าแบรนด์เนม รับประกันของแท้', NULL, NULL, 0, 30, 4, 2, 7, 'airpods-pro-2-mall-ml8517q8-2', 1, NULL, 'AirPods Pro 2 รุ่นล่าสุด', 7990.00, NULL, '2026-02-05 02:39:09.836', '2026-02-05 02:39:09.873', NULL),
	(24, '[Mall] iPad Air 10.9 นิ้ว Wi-Fi 64GB. สินค้าแบรนด์เนม รับประกันของแท้', NULL, NULL, 0, 20, 4, 2, 7, 'ipad-air-109-wi-fi-64gb-mall-ml8517qi-3', 1, NULL, 'iPad Air 10.9 นิ้ว Wi-Fi 64GB', 19900.00, NULL, '2026-02-05 02:39:09.836', '2026-02-05 02:39:09.873', NULL),
	(25, '[Mall] Apple Watch Series 9 GPS 41mm. สินค้าแบรนด์เนม รับประกันของแท้', NULL, NULL, 0, 25, 4, 2, 7, 'apple-watch-series-9-gps-41mm-mall-ml8517qt-4', 1, NULL, 'Apple Watch Series 9 GPS 41mm', 12900.00, NULL, '2026-02-05 02:39:09.836', '2026-02-05 02:39:09.873', NULL),
	(26, '[Mall] Samsung Galaxy S24 Ultra 512GB. สินค้าแบรนด์เนม รับประกันของแท้', NULL, NULL, 0, 12, 4, 2, 7, 'samsung-galaxy-s24-ultra-512gb-mall-ml8517r4-5', 1, NULL, 'Samsung Galaxy S24 Ultra 512GB', 44900.00, NULL, '2026-02-05 02:39:09.836', '2026-02-05 02:39:09.873', NULL),
	(27, '[Mall] Sony WH-1000XM5 หูฟังไร้สาย. สินค้าแบรนด์เนม รับประกันของแท้', NULL, NULL, 0, 18, 4, 2, 7, 'sony-wh-1000xm5-mall-ml8517rd-6', 1, NULL, 'Sony WH-1000XM5 หูฟังไร้สาย', 11990.00, NULL, '2026-02-05 02:39:09.836', '2026-02-05 02:39:09.873', NULL),
	(28, '[Mall] Dyson V15 Detect สายรุ่นล่าสุด. สินค้าแบรนด์เนม รับประกันของแท้', NULL, NULL, 0, 8, 4, 2, 7, 'dyson-v15-detect-mall-ml8517rn-7', 1, NULL, 'Dyson V15 Detect สายรุ่นล่าสุด', 24900.00, NULL, '2026-02-05 02:39:09.836', '2026-02-05 02:39:09.873', NULL),
	(29, '[Mall] Nintendo Switch OLED. สินค้าแบรนด์เนม รับประกันของแท้', NULL, NULL, 0, 22, 4, 2, 7, 'nintendo-switch-oled-mall-ml8517s0-8', 1, NULL, 'Nintendo Switch OLED', 12990.00, NULL, '2026-02-05 02:39:09.836', '2026-02-05 02:39:09.873', NULL),
	(30, '[Mall] Kindle Paperwhite 11th Gen. สินค้าแบรนด์เนม รับประกันของแท้', NULL, NULL, 0, 35, 4, 2, 7, 'kindle-paperwhite-11th-gen-mall-ml8517sd-9', 1, NULL, 'Kindle Paperwhite 11th Gen', 5990.00, NULL, '2026-02-05 02:39:09.836', '2026-02-05 02:39:09.873', NULL),
	(31, '[Mall] iPhone 15 Pro Max. สินค้าแบรนด์เนม รับประกันของแท้', NULL, NULL, 0, 17, 4, 2, 7, 'iphone-15-pro-max-mall-ml854ldo-0', 1, NULL, 'iPhone 15 Pro Max', 42900.00, NULL, '2026-02-05 02:39:09.836', '2026-02-05 02:39:09.873', NULL),
	(32, '[Mall] MacBook Air M3 13 นิ้ว. สินค้าแบรนด์เนม รับประกันของแท้', NULL, NULL, 0, 10, 4, 2, 7, 'macbook-air-m3-13-mall-ml854lef-1', 1, NULL, 'MacBook Air M3 13 นิ้ว', 35900.00, NULL, '2026-02-05 02:39:09.836', '2026-02-05 02:39:09.873', NULL),
	(33, '[Mall] AirPods Pro 2 รุ่นล่าสุด. สินค้าแบรนด์เนม รับประกันของแท้', NULL, NULL, 0, 30, 4, 2, 7, 'airpods-pro-2-mall-ml854ley-2', 1, NULL, 'AirPods Pro 2 รุ่นล่าสุด', 7990.00, NULL, '2026-02-05 02:39:09.836', '2026-02-05 02:39:09.873', NULL),
	(34, '[Mall] iPad Air 10.9 นิ้ว Wi-Fi. สินค้าแบรนด์เนม รับประกันของแท้', NULL, NULL, 0, 23, 4, 2, 7, 'ipad-air-109-wi-fi-mall-ml854lff-3', 1, NULL, 'iPad Air 10.9 นิ้ว Wi-Fi', 19900.00, NULL, '2026-02-05 02:39:09.836', '2026-02-05 02:39:09.873', NULL),
	(35, '[Mall] Apple Watch Series 9 GPS. สินค้าแบรนด์เนม รับประกันของแท้', NULL, NULL, 0, 25, 4, 2, 7, 'apple-watch-series-9-gps-mall-ml854lg0-4', 1, NULL, 'Apple Watch Series 9 GPS', 12900.00, NULL, '2026-02-05 02:39:09.836', '2026-02-05 02:39:09.873', NULL),
	(36, '[Mall] Samsung Galaxy S24 Ultra. สินค้าแบรนด์เนม รับประกันของแท้', NULL, NULL, 0, 12, 4, 2, 7, 'samsung-galaxy-s24-ultra-mall-ml854lgm-5', 1, NULL, 'Samsung Galaxy S24 Ultra', 44900.00, NULL, '2026-02-05 02:39:09.836', '2026-02-05 02:39:09.873', NULL),
	(37, '[Mall] Sony WH-1000XM5 หูฟังไร้สาย. สินค้าแบรนด์เนม รับประกันของแท้', NULL, NULL, 0, 18, 4, 2, 7, 'sony-wh-1000xm5-mall-ml854lh9-6', 1, NULL, 'Sony WH-1000XM5 หูฟังไร้สาย', 11990.00, NULL, '2026-02-05 02:39:09.836', '2026-02-05 02:39:09.873', NULL),
	(38, '[Mall] Dyson V15 Detect สายรุ่นล่าสุด. สินค้าแบรนด์เนม รับประกันของแท้', NULL, NULL, 0, 8, 4, 2, 7, 'dyson-v15-detect-mall-ml854lho-7', 1, NULL, 'Dyson V15 Detect สายรุ่นล่าสุด', 24900.00, NULL, '2026-02-05 02:39:09.836', '2026-02-05 02:39:09.873', NULL),
	(39, '[Mall] Nintendo Switch OLED. สินค้าแบรนด์เนม รับประกันของแท้', NULL, NULL, 0, 22, 4, 2, 7, 'nintendo-switch-oled-mall-ml854li0-8', 1, NULL, 'Nintendo Switch OLED', 12990.00, NULL, '2026-02-05 02:39:09.836', '2026-02-05 02:39:09.873', NULL),
	(40, '[Mall] Kindle Paperwhite 11th Gen. สินค้าแบรนด์เนม รับประกันของแท้', NULL, NULL, 0, 35, 4, 2, 7, 'kindle-paperwhite-11th-gen-mall-ml854lie-9', 1, NULL, 'Kindle Paperwhite 11th Gen', 5990.00, NULL, '2026-02-05 02:39:09.836', '2026-02-05 02:39:09.873', NULL);

-- Dumping structure for table ecom1.productoncart
CREATE TABLE IF NOT EXISTS `productoncart` (
  `id` int NOT NULL AUTO_INCREMENT,
  `cartId` int NOT NULL,
  `productId` int NOT NULL,
  `count` int NOT NULL,
  `variantId` int DEFAULT NULL,
  `price` decimal(10,2) NOT NULL,
  `selectedVariants` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  KEY `FK_cbda7990ecb34e77e56f0ad33a6` (`cartId`),
  KEY `FK_573f0740f734e4d69a1c3d447a1` (`productId`),
  KEY `FK_c10c534270c8f5a27e8151e73cf` (`variantId`),
  CONSTRAINT `FK_573f0740f734e4d69a1c3d447a1` FOREIGN KEY (`productId`) REFERENCES `product` (`id`),
  CONSTRAINT `FK_c10c534270c8f5a27e8151e73cf` FOREIGN KEY (`variantId`) REFERENCES `product_variant` (`id`) ON DELETE SET NULL,
  CONSTRAINT `FK_cbda7990ecb34e77e56f0ad33a6` FOREIGN KEY (`cartId`) REFERENCES `cart` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table ecom1.productoncart: ~0 rows (approximately)
INSERT INTO `productoncart` (`id`, `cartId`, `productId`, `count`, `variantId`, `price`, `selectedVariants`) VALUES
	(1, 2, 10, 1, NULL, 189.00, NULL),
	(2, 1, 2, 2, NULL, 899.00, NULL),
	(3, 1, 40, 1, NULL, 5990.00, NULL),
	(4, 1, 39, 1, NULL, 12990.00, NULL),
	(5, 1, 38, 1, NULL, 24900.00, NULL),
	(6, 1, 34, 2, NULL, 19900.00, NULL),
	(7, 1, 36, 1, NULL, 44900.00, NULL);

-- Dumping structure for table ecom1.productonorder
CREATE TABLE IF NOT EXISTS `productonorder` (
  `id` int NOT NULL AUTO_INCREMENT,
  `productId` int NOT NULL,
  `orderId` int NOT NULL,
  `count` int NOT NULL,
  `variantId` int DEFAULT NULL,
  `price` decimal(10,2) NOT NULL,
  `selectedVariants` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  KEY `FK_6c21302db79c5f4ac7048d37194` (`productId`),
  KEY `FK_aec85320190e5a4c0d4f5488a45` (`orderId`),
  KEY `FK_cc583d9d03cc8e3c65a116ec464` (`variantId`),
  CONSTRAINT `FK_6c21302db79c5f4ac7048d37194` FOREIGN KEY (`productId`) REFERENCES `product` (`id`),
  CONSTRAINT `FK_aec85320190e5a4c0d4f5488a45` FOREIGN KEY (`orderId`) REFERENCES `order` (`id`),
  CONSTRAINT `FK_cc583d9d03cc8e3c65a116ec464` FOREIGN KEY (`variantId`) REFERENCES `product_variant` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table ecom1.productonorder: ~0 rows (approximately)

-- Dumping structure for table ecom1.product_variant
CREATE TABLE IF NOT EXISTS `product_variant` (
  `id` int NOT NULL AUTO_INCREMENT,
  `productId` int NOT NULL,
  `price` decimal(10,2) DEFAULT NULL,
  `stock` int NOT NULL,
  `imageIndex` int DEFAULT NULL,
  `attributes` json DEFAULT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `sku` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FK_6e420052844edf3a5506d863ce6` (`productId`),
  CONSTRAINT `FK_6e420052844edf3a5506d863ce6` FOREIGN KEY (`productId`) REFERENCES `product` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=697 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table ecom1.product_variant: ~0 rows (approximately)
INSERT INTO `product_variant` (`id`, `productId`, `price`, `stock`, `imageIndex`, `attributes`, `name`, `sku`) VALUES
	(481, 11, 42900.00, 15, NULL, NULL, 'รุ่นมาตรฐาน', 'MALL-0011-1'),
	(482, 12, 35900.00, 10, NULL, NULL, 'รุ่นมาตรฐาน', 'MALL-0012-1'),
	(483, 13, 7990.00, 30, NULL, NULL, 'รุ่นมาตรฐาน', 'MALL-0013-1'),
	(484, 14, 19900.00, 20, NULL, NULL, 'รุ่นมาตรฐาน', 'MALL-0014-1'),
	(485, 15, 12900.00, 25, NULL, NULL, 'รุ่นมาตรฐาน', 'MALL-0015-1'),
	(486, 16, 44900.00, 12, NULL, NULL, 'รุ่นมาตรฐาน', 'MALL-0016-1'),
	(487, 17, 11990.00, 18, NULL, NULL, 'รุ่นมาตรฐาน', 'MALL-0017-1'),
	(488, 18, 24900.00, 8, NULL, NULL, 'รุ่นมาตรฐาน', 'MALL-0018-1'),
	(489, 19, 12990.00, 22, NULL, NULL, 'รุ่นมาตรฐาน', 'MALL-0019-1'),
	(490, 20, 5990.00, 35, NULL, NULL, 'รุ่นมาตรฐาน', 'MALL-0020-1'),
	(491, 21, 42900.00, 15, NULL, NULL, 'รุ่นมาตรฐาน', 'MALL-0021-1'),
	(492, 22, 35900.00, 10, NULL, NULL, 'รุ่นมาตรฐาน', 'MALL-0022-1'),
	(493, 23, 7990.00, 30, NULL, NULL, 'รุ่นมาตรฐาน', 'MALL-0023-1'),
	(494, 24, 19900.00, 20, NULL, NULL, 'รุ่นมาตรฐาน', 'MALL-0024-1'),
	(495, 25, 12900.00, 25, NULL, NULL, 'รุ่นมาตรฐาน', 'MALL-0025-1'),
	(496, 26, 44900.00, 12, NULL, NULL, 'รุ่นมาตรฐาน', 'MALL-0026-1'),
	(497, 27, 11990.00, 18, NULL, NULL, 'รุ่นมาตรฐาน', 'MALL-0027-1'),
	(498, 28, 24900.00, 8, NULL, NULL, 'รุ่นมาตรฐาน', 'MALL-0028-1'),
	(499, 29, 12990.00, 22, NULL, NULL, 'รุ่นมาตรฐาน', 'MALL-0029-1'),
	(500, 30, 5990.00, 35, NULL, NULL, 'รุ่นมาตรฐาน', 'MALL-0030-1'),
	(501, 31, 42900.00, 4, NULL, '{"สี": "เทาทิตาเนียม", "ความจุ": "256GB"}', '256GB สีเทาทิตาเนียม', 'MALL-IP15PM-256-TITANIUM'),
	(502, 31, 42900.00, 3, NULL, '{"สี": "น้ำเงิน", "ความจุ": "256GB"}', '256GB สีน้ำเงิน', 'MALL-IP15PM-256-BLUE'),
	(503, 31, 42900.00, 4, NULL, '{"สี": "ขาว", "ความจุ": "256GB"}', '256GB สีขาว', 'MALL-IP15PM-256-WHITE'),
	(504, 31, 42900.00, 4, NULL, '{"สี": "ดำ", "ความจุ": "256GB"}', '256GB สีดำ', 'MALL-IP15PM-256-BLACK'),
	(505, 31, 48900.00, 2, NULL, '{"สี": "เทาทิตาเนียม", "ความจุ": "512GB"}', '512GB สีเทาทิตาเนียม', 'MALL-IP15PM-512-TITANIUM'),
	(506, 32, 35900.00, 3, NULL, '{"สี": "Midnight", "ความจุ": "256GB"}', '256GB Midnight', 'MALL-MBAIR3-256-MIDNIGHT'),
	(507, 32, 35900.00, 2, NULL, '{"สี": "Starlight", "ความจุ": "256GB"}', '256GB Starlight', 'MALL-MBAIR3-256-STARLIGHT'),
	(508, 32, 35900.00, 3, NULL, '{"สี": "Space Gray", "ความจุ": "256GB"}', '256GB Space Gray', 'MALL-MBAIR3-256-SPACE'),
	(509, 32, 42900.00, 2, NULL, '{"สี": "Midnight", "ความจุ": "512GB"}', '512GB Midnight', 'MALL-MBAIR3-512-MIDNIGHT'),
	(510, 33, 7990.00, 15, NULL, '{"สี": "ขาว"}', 'สีขาว', 'MALL-AIRPOD2-WHITE'),
	(511, 33, 7990.00, 15, NULL, '{"สี": "ดำ"}', 'สีดำ', 'MALL-AIRPOD2-BLACK'),
	(512, 34, 19900.00, 5, NULL, '{"สี": "บลู", "ความจุ": "64GB"}', '64GB สีบลู', 'MALL-IPADAIR-64-BLUE'),
	(513, 34, 19900.00, 5, NULL, '{"สี": "พิงค์", "ความจุ": "64GB"}', '64GB สีพิงค์', 'MALL-IPADAIR-64-PINK'),
	(514, 34, 19900.00, 5, NULL, '{"สี": "ม่วง", "ความจุ": "64GB"}', '64GB สีม่วง', 'MALL-IPADAIR-64-PURPLE'),
	(515, 34, 19900.00, 5, NULL, '{"สี": "Starlight", "ความจุ": "64GB"}', '64GB Starlight', 'MALL-IPADAIR-64-STARLIGHT'),
	(516, 34, 23900.00, 3, NULL, '{"สี": "บลู", "ความจุ": "256GB"}', '256GB สีบลู', 'MALL-IPADAIR-256-BLUE'),
	(517, 35, 12900.00, 5, NULL, '{"สี": "พิงค์", "ขนาด": "41mm"}', '41mm สีพิงค์', 'MALL-AW9-41-PINK'),
	(518, 35, 12900.00, 5, NULL, '{"สี": "Starlight", "ขนาด": "41mm"}', '41mm Starlight', 'MALL-AW9-41-STARLIGHT'),
	(519, 35, 12900.00, 5, NULL, '{"สี": "Midnight", "ขนาด": "41mm"}', '41mm Midnight', 'MALL-AW9-41-MIDNIGHT'),
	(520, 35, 13900.00, 5, NULL, '{"สี": "พิงค์", "ขนาด": "45mm"}', '45mm สีพิงค์', 'MALL-AW9-45-PINK'),
	(521, 35, 13900.00, 5, NULL, '{"สี": "Starlight", "ขนาด": "45mm"}', '45mm Starlight', 'MALL-AW9-45-STARLIGHT'),
	(522, 36, 44900.00, 3, NULL, '{"สี": "Titanium Gray", "ความจุ": "256GB"}', '256GB Titanium Gray', 'MALL-S24U-256-GRAY'),
	(523, 36, 44900.00, 3, NULL, '{"สี": "ดำ", "ความจุ": "256GB"}', '256GB Black', 'MALL-S24U-256-BLACK'),
	(524, 36, 44900.00, 2, NULL, '{"สี": "ม่วง", "ความจุ": "256GB"}', '256GB Violet', 'MALL-S24U-256-VIOLET'),
	(525, 36, 49900.00, 2, NULL, '{"สี": "Titanium Gray", "ความจุ": "512GB"}', '512GB Titanium Gray', 'MALL-S24U-512-GRAY'),
	(526, 36, 49900.00, 2, NULL, '{"สี": "ดำ", "ความจุ": "512GB"}', '512GB Black', 'MALL-S24U-512-BLACK'),
	(527, 37, 11990.00, 10, NULL, '{"สี": "ดำ"}', 'สีดำ', 'MALL-WH1KX5-BLACK'),
	(528, 37, 11990.00, 8, NULL, '{"สี": "ซิลเวอร์"}', 'สีซิลเวอร์', 'MALL-WH1KX5-SILVER'),
	(529, 38, 24900.00, 4, NULL, '{"สี": "ทอง/นิกเกิล"}', 'สีทอง/นิกเกิล', 'MALL-DYSON15-GOLD-NICKEL'),
	(530, 38, 24900.00, 4, NULL, '{"สี": "ม่วง/นิกเกิล"}', 'สีม่วง/นิกเกิล', 'MALL-DYSON15-PURPLE-NICKEL'),
	(531, 39, 12990.00, 12, NULL, '{"สี": "ขาว"}', 'สีขาว', 'MALL-NSOLED-WHITE'),
	(532, 39, 12990.00, 10, NULL, '{"สี": "แดง/น้ำเงิน"}', 'สีแดง/น้ำเงิน (Joy-Con)', 'MALL-NSOLED-RED-BLUE'),
	(533, 40, 5990.00, 12, NULL, '{"สี": "ดำ", "ความจุ": "8GB"}', '8GB สีดำ', 'MALL-KNDL11-8-BLACK'),
	(534, 40, 6990.00, 10, NULL, '{"สี": "ดำ", "ความจุ": "16GB"}', '16GB สีดำ', 'MALL-KNDL11-16-BLACK'),
	(535, 40, 6990.00, 6, NULL, '{"สี": "Denim", "ความจุ": "16GB"}', '16GB Denim', 'MALL-KNDL11-16-DENIM'),
	(536, 40, 6990.00, 7, NULL, '{"สี": "Agave Green", "ความจุ": "16GB"}', '16GB Agave Green', 'MALL-KNDL11-16-GREEN'),
	(537, 1, NULL, 11, NULL, '{"สี": "ขาว", "ไซส์": "S"}', 'สีขาว / ไซส์S', 'S1-P001-WH-S'),
	(538, 1, NULL, 13, NULL, '{"สี": "ขาว", "ไซส์": "M"}', 'สีขาว / ไซส์M', 'S1-P001-WH-M'),
	(539, 1, NULL, 12, NULL, '{"สี": "ขาว", "ไซส์": "L"}', 'สีขาว / ไซส์L', 'S1-P001-WH-L'),
	(540, 1, NULL, 8, NULL, '{"สี": "ขาว", "ไซส์": "XL"}', 'สีขาว / ไซส์XL', 'S1-P001-WH-XL'),
	(541, 1, NULL, 7, NULL, '{"สี": "ดำ", "ไซส์": "S"}', 'สีดำ / ไซส์S', 'S1-P001-BL-S'),
	(542, 1, NULL, 14, NULL, '{"สี": "ดำ", "ไซส์": "M"}', 'สีดำ / ไซส์M', 'S1-P001-BL-M'),
	(543, 1, NULL, 10, NULL, '{"สี": "ดำ", "ไซส์": "L"}', 'สีดำ / ไซส์L', 'S1-P001-BL-L'),
	(544, 1, NULL, 7, NULL, '{"สี": "ดำ", "ไซส์": "XL"}', 'สีดำ / ไซส์XL', 'S1-P001-BL-XL'),
	(545, 1, NULL, 10, NULL, '{"สี": "แดง", "ไซส์": "S"}', 'สีแดง / ไซส์S', 'S1-P001-RD-S'),
	(546, 1, NULL, 9, NULL, '{"สี": "แดง", "ไซส์": "M"}', 'สีแดง / ไซส์M', 'S1-P001-RD-M'),
	(547, 1, NULL, 8, NULL, '{"สี": "แดง", "ไซส์": "L"}', 'สีแดง / ไซส์L', 'S1-P001-RD-L'),
	(548, 1, NULL, 6, NULL, '{"สี": "แดง", "ไซส์": "XL"}', 'สีแดง / ไซส์XL', 'S1-P001-RD-XL'),
	(549, 1, NULL, 9, NULL, '{"สี": "น้ำเงิน", "ไซส์": "S"}', 'สีน้ำเงิน / ไซส์S', 'S1-P001-BU-S'),
	(550, 1, NULL, 14, NULL, '{"สี": "น้ำเงิน", "ไซส์": "M"}', 'สีน้ำเงิน / ไซส์M', 'S1-P001-BU-M'),
	(551, 1, NULL, 6, NULL, '{"สี": "น้ำเงิน", "ไซส์": "L"}', 'สีน้ำเงิน / ไซส์L', 'S1-P001-BU-L'),
	(552, 1, NULL, 14, NULL, '{"สี": "น้ำเงิน", "ไซส์": "XL"}', 'สีน้ำเงิน / ไซส์XL', 'S1-P001-BU-XL'),
	(553, 2, NULL, 11, NULL, '{"สี": "ขาว", "ไซส์": "S"}', 'สีขาว / ไซส์S', 'S1-P002-WH-S'),
	(554, 2, NULL, 8, NULL, '{"สี": "ขาว", "ไซส์": "M"}', 'สีขาว / ไซส์M', 'S1-P002-WH-M'),
	(555, 2, NULL, 13, NULL, '{"สี": "ขาว", "ไซส์": "L"}', 'สีขาว / ไซส์L', 'S1-P002-WH-L'),
	(556, 2, NULL, 7, NULL, '{"สี": "ขาว", "ไซส์": "XL"}', 'สีขาว / ไซส์XL', 'S1-P002-WH-XL'),
	(557, 2, NULL, 7, NULL, '{"สี": "ดำ", "ไซส์": "S"}', 'สีดำ / ไซส์S', 'S1-P002-BL-S'),
	(558, 2, NULL, 13, NULL, '{"สี": "ดำ", "ไซส์": "M"}', 'สีดำ / ไซส์M', 'S1-P002-BL-M'),
	(559, 2, NULL, 6, NULL, '{"สี": "ดำ", "ไซส์": "L"}', 'สีดำ / ไซส์L', 'S1-P002-BL-L'),
	(560, 2, NULL, 11, NULL, '{"สี": "ดำ", "ไซส์": "XL"}', 'สีดำ / ไซส์XL', 'S1-P002-BL-XL'),
	(561, 2, NULL, 6, NULL, '{"สี": "แดง", "ไซส์": "S"}', 'สีแดง / ไซส์S', 'S1-P002-RD-S'),
	(562, 2, NULL, 14, NULL, '{"สี": "แดง", "ไซส์": "M"}', 'สีแดง / ไซส์M', 'S1-P002-RD-M'),
	(563, 2, NULL, 10, NULL, '{"สี": "แดง", "ไซส์": "L"}', 'สีแดง / ไซส์L', 'S1-P002-RD-L'),
	(564, 2, NULL, 9, NULL, '{"สี": "แดง", "ไซส์": "XL"}', 'สีแดง / ไซส์XL', 'S1-P002-RD-XL'),
	(565, 2, NULL, 11, NULL, '{"สี": "น้ำเงิน", "ไซส์": "S"}', 'สีน้ำเงิน / ไซส์S', 'S1-P002-BU-S'),
	(566, 2, NULL, 13, NULL, '{"สี": "น้ำเงิน", "ไซส์": "M"}', 'สีน้ำเงิน / ไซส์M', 'S1-P002-BU-M'),
	(567, 2, NULL, 5, NULL, '{"สี": "น้ำเงิน", "ไซส์": "L"}', 'สีน้ำเงิน / ไซส์L', 'S1-P002-BU-L'),
	(568, 2, NULL, 13, NULL, '{"สี": "น้ำเงิน", "ไซส์": "XL"}', 'สีน้ำเงิน / ไซส์XL', 'S1-P002-BU-XL'),
	(569, 3, NULL, 5, NULL, '{"สี": "ขาว", "ไซส์": "S"}', 'สีขาว / ไซส์S', 'S1-P003-WH-S'),
	(570, 3, NULL, 5, NULL, '{"สี": "ขาว", "ไซส์": "M"}', 'สีขาว / ไซส์M', 'S1-P003-WH-M'),
	(571, 3, NULL, 6, NULL, '{"สี": "ขาว", "ไซส์": "L"}', 'สีขาว / ไซส์L', 'S1-P003-WH-L'),
	(572, 3, NULL, 9, NULL, '{"สี": "ขาว", "ไซส์": "XL"}', 'สีขาว / ไซส์XL', 'S1-P003-WH-XL'),
	(573, 3, NULL, 5, NULL, '{"สี": "ดำ", "ไซส์": "S"}', 'สีดำ / ไซส์S', 'S1-P003-BL-S'),
	(574, 3, NULL, 7, NULL, '{"สี": "ดำ", "ไซส์": "M"}', 'สีดำ / ไซส์M', 'S1-P003-BL-M'),
	(575, 3, NULL, 14, NULL, '{"สี": "ดำ", "ไซส์": "L"}', 'สีดำ / ไซส์L', 'S1-P003-BL-L'),
	(576, 3, NULL, 8, NULL, '{"สี": "ดำ", "ไซส์": "XL"}', 'สีดำ / ไซส์XL', 'S1-P003-BL-XL'),
	(577, 3, NULL, 10, NULL, '{"สี": "แดง", "ไซส์": "S"}', 'สีแดง / ไซส์S', 'S1-P003-RD-S'),
	(578, 3, NULL, 10, NULL, '{"สี": "แดง", "ไซส์": "M"}', 'สีแดง / ไซส์M', 'S1-P003-RD-M'),
	(579, 3, NULL, 10, NULL, '{"สี": "แดง", "ไซส์": "L"}', 'สีแดง / ไซส์L', 'S1-P003-RD-L'),
	(580, 3, NULL, 10, NULL, '{"สี": "แดง", "ไซส์": "XL"}', 'สีแดง / ไซส์XL', 'S1-P003-RD-XL'),
	(581, 3, NULL, 14, NULL, '{"สี": "น้ำเงิน", "ไซส์": "S"}', 'สีน้ำเงิน / ไซส์S', 'S1-P003-BU-S'),
	(582, 3, NULL, 13, NULL, '{"สี": "น้ำเงิน", "ไซส์": "M"}', 'สีน้ำเงิน / ไซส์M', 'S1-P003-BU-M'),
	(583, 3, NULL, 9, NULL, '{"สี": "น้ำเงิน", "ไซส์": "L"}', 'สีน้ำเงิน / ไซส์L', 'S1-P003-BU-L'),
	(584, 3, NULL, 5, NULL, '{"สี": "น้ำเงิน", "ไซส์": "XL"}', 'สีน้ำเงิน / ไซส์XL', 'S1-P003-BU-XL'),
	(585, 4, NULL, 9, NULL, '{"สี": "ขาว", "ไซส์": "S"}', 'สีขาว / ไซส์S', 'S1-P004-WH-S'),
	(586, 4, NULL, 9, NULL, '{"สี": "ขาว", "ไซส์": "M"}', 'สีขาว / ไซส์M', 'S1-P004-WH-M'),
	(587, 4, NULL, 7, NULL, '{"สี": "ขาว", "ไซส์": "L"}', 'สีขาว / ไซส์L', 'S1-P004-WH-L'),
	(588, 4, NULL, 5, NULL, '{"สี": "ขาว", "ไซส์": "XL"}', 'สีขาว / ไซส์XL', 'S1-P004-WH-XL'),
	(589, 4, NULL, 13, NULL, '{"สี": "ดำ", "ไซส์": "S"}', 'สีดำ / ไซส์S', 'S1-P004-BL-S'),
	(590, 4, NULL, 13, NULL, '{"สี": "ดำ", "ไซส์": "M"}', 'สีดำ / ไซส์M', 'S1-P004-BL-M'),
	(591, 4, NULL, 14, NULL, '{"สี": "ดำ", "ไซส์": "L"}', 'สีดำ / ไซส์L', 'S1-P004-BL-L'),
	(592, 4, NULL, 7, NULL, '{"สี": "ดำ", "ไซส์": "XL"}', 'สีดำ / ไซส์XL', 'S1-P004-BL-XL'),
	(593, 4, NULL, 10, NULL, '{"สี": "แดง", "ไซส์": "S"}', 'สีแดง / ไซส์S', 'S1-P004-RD-S'),
	(594, 4, NULL, 13, NULL, '{"สี": "แดง", "ไซส์": "M"}', 'สีแดง / ไซส์M', 'S1-P004-RD-M'),
	(595, 4, NULL, 9, NULL, '{"สี": "แดง", "ไซส์": "L"}', 'สีแดง / ไซส์L', 'S1-P004-RD-L'),
	(596, 4, NULL, 14, NULL, '{"สี": "แดง", "ไซส์": "XL"}', 'สีแดง / ไซส์XL', 'S1-P004-RD-XL'),
	(597, 4, NULL, 9, NULL, '{"สี": "น้ำเงิน", "ไซส์": "S"}', 'สีน้ำเงิน / ไซส์S', 'S1-P004-BU-S'),
	(598, 4, NULL, 13, NULL, '{"สี": "น้ำเงิน", "ไซส์": "M"}', 'สีน้ำเงิน / ไซส์M', 'S1-P004-BU-M'),
	(599, 4, NULL, 6, NULL, '{"สี": "น้ำเงิน", "ไซส์": "L"}', 'สีน้ำเงิน / ไซส์L', 'S1-P004-BU-L'),
	(600, 4, NULL, 14, NULL, '{"สี": "น้ำเงิน", "ไซส์": "XL"}', 'สีน้ำเงิน / ไซส์XL', 'S1-P004-BU-XL'),
	(601, 5, NULL, 12, NULL, '{"สี": "ขาว", "ไซส์": "S"}', 'สีขาว / ไซส์S', 'S1-P005-WH-S'),
	(602, 5, NULL, 5, NULL, '{"สี": "ขาว", "ไซส์": "M"}', 'สีขาว / ไซส์M', 'S1-P005-WH-M'),
	(603, 5, NULL, 8, NULL, '{"สี": "ขาว", "ไซส์": "L"}', 'สีขาว / ไซส์L', 'S1-P005-WH-L'),
	(604, 5, NULL, 5, NULL, '{"สี": "ขาว", "ไซส์": "XL"}', 'สีขาว / ไซส์XL', 'S1-P005-WH-XL'),
	(605, 5, NULL, 10, NULL, '{"สี": "ดำ", "ไซส์": "S"}', 'สีดำ / ไซส์S', 'S1-P005-BL-S'),
	(606, 5, NULL, 11, NULL, '{"สี": "ดำ", "ไซส์": "M"}', 'สีดำ / ไซส์M', 'S1-P005-BL-M'),
	(607, 5, NULL, 12, NULL, '{"สี": "ดำ", "ไซส์": "L"}', 'สีดำ / ไซส์L', 'S1-P005-BL-L'),
	(608, 5, NULL, 11, NULL, '{"สี": "ดำ", "ไซส์": "XL"}', 'สีดำ / ไซส์XL', 'S1-P005-BL-XL'),
	(609, 5, NULL, 8, NULL, '{"สี": "แดง", "ไซส์": "S"}', 'สีแดง / ไซส์S', 'S1-P005-RD-S'),
	(610, 5, NULL, 6, NULL, '{"สี": "แดง", "ไซส์": "M"}', 'สีแดง / ไซส์M', 'S1-P005-RD-M'),
	(611, 5, NULL, 13, NULL, '{"สี": "แดง", "ไซส์": "L"}', 'สีแดง / ไซส์L', 'S1-P005-RD-L'),
	(612, 5, NULL, 8, NULL, '{"สี": "แดง", "ไซส์": "XL"}', 'สีแดง / ไซส์XL', 'S1-P005-RD-XL'),
	(613, 5, NULL, 12, NULL, '{"สี": "น้ำเงิน", "ไซส์": "S"}', 'สีน้ำเงิน / ไซส์S', 'S1-P005-BU-S'),
	(614, 5, NULL, 5, NULL, '{"สี": "น้ำเงิน", "ไซส์": "M"}', 'สีน้ำเงิน / ไซส์M', 'S1-P005-BU-M'),
	(615, 5, NULL, 11, NULL, '{"สี": "น้ำเงิน", "ไซส์": "L"}', 'สีน้ำเงิน / ไซส์L', 'S1-P005-BU-L'),
	(616, 5, NULL, 6, NULL, '{"สี": "น้ำเงิน", "ไซส์": "XL"}', 'สีน้ำเงิน / ไซส์XL', 'S1-P005-BU-XL'),
	(617, 6, NULL, 7, NULL, '{"สี": "ขาว", "ไซส์": "S"}', 'สีขาว / ไซส์S', 'S1-P006-WH-S'),
	(618, 6, NULL, 5, NULL, '{"สี": "ขาว", "ไซส์": "M"}', 'สีขาว / ไซส์M', 'S1-P006-WH-M'),
	(619, 6, NULL, 11, NULL, '{"สี": "ขาว", "ไซส์": "L"}', 'สีขาว / ไซส์L', 'S1-P006-WH-L'),
	(620, 6, NULL, 8, NULL, '{"สี": "ขาว", "ไซส์": "XL"}', 'สีขาว / ไซส์XL', 'S1-P006-WH-XL'),
	(621, 6, NULL, 14, NULL, '{"สี": "ดำ", "ไซส์": "S"}', 'สีดำ / ไซส์S', 'S1-P006-BL-S'),
	(622, 6, NULL, 10, NULL, '{"สี": "ดำ", "ไซส์": "M"}', 'สีดำ / ไซส์M', 'S1-P006-BL-M'),
	(623, 6, NULL, 11, NULL, '{"สี": "ดำ", "ไซส์": "L"}', 'สีดำ / ไซส์L', 'S1-P006-BL-L'),
	(624, 6, NULL, 7, NULL, '{"สี": "ดำ", "ไซส์": "XL"}', 'สีดำ / ไซส์XL', 'S1-P006-BL-XL'),
	(625, 6, NULL, 5, NULL, '{"สี": "แดง", "ไซส์": "S"}', 'สีแดง / ไซส์S', 'S1-P006-RD-S'),
	(626, 6, NULL, 13, NULL, '{"สี": "แดง", "ไซส์": "M"}', 'สีแดง / ไซส์M', 'S1-P006-RD-M'),
	(627, 6, NULL, 7, NULL, '{"สี": "แดง", "ไซส์": "L"}', 'สีแดง / ไซส์L', 'S1-P006-RD-L'),
	(628, 6, NULL, 9, NULL, '{"สี": "แดง", "ไซส์": "XL"}', 'สีแดง / ไซส์XL', 'S1-P006-RD-XL'),
	(629, 6, NULL, 10, NULL, '{"สี": "น้ำเงิน", "ไซส์": "S"}', 'สีน้ำเงิน / ไซส์S', 'S1-P006-BU-S'),
	(630, 6, NULL, 13, NULL, '{"สี": "น้ำเงิน", "ไซส์": "M"}', 'สีน้ำเงิน / ไซส์M', 'S1-P006-BU-M'),
	(631, 6, NULL, 9, NULL, '{"สี": "น้ำเงิน", "ไซส์": "L"}', 'สีน้ำเงิน / ไซส์L', 'S1-P006-BU-L'),
	(632, 6, NULL, 8, NULL, '{"สี": "น้ำเงิน", "ไซส์": "XL"}', 'สีน้ำเงิน / ไซส์XL', 'S1-P006-BU-XL'),
	(633, 7, NULL, 13, NULL, '{"สี": "ขาว", "ไซส์": "S"}', 'สีขาว / ไซส์S', 'S1-P007-WH-S'),
	(634, 7, NULL, 14, NULL, '{"สี": "ขาว", "ไซส์": "M"}', 'สีขาว / ไซส์M', 'S1-P007-WH-M'),
	(635, 7, NULL, 11, NULL, '{"สี": "ขาว", "ไซส์": "L"}', 'สีขาว / ไซส์L', 'S1-P007-WH-L'),
	(636, 7, NULL, 6, NULL, '{"สี": "ขาว", "ไซส์": "XL"}', 'สีขาว / ไซส์XL', 'S1-P007-WH-XL'),
	(637, 7, NULL, 9, NULL, '{"สี": "ดำ", "ไซส์": "S"}', 'สีดำ / ไซส์S', 'S1-P007-BL-S'),
	(638, 7, NULL, 9, NULL, '{"สี": "ดำ", "ไซส์": "M"}', 'สีดำ / ไซส์M', 'S1-P007-BL-M'),
	(639, 7, NULL, 12, NULL, '{"สี": "ดำ", "ไซส์": "L"}', 'สีดำ / ไซส์L', 'S1-P007-BL-L'),
	(640, 7, NULL, 12, NULL, '{"สี": "ดำ", "ไซส์": "XL"}', 'สีดำ / ไซส์XL', 'S1-P007-BL-XL'),
	(641, 7, NULL, 13, NULL, '{"สี": "แดง", "ไซส์": "S"}', 'สีแดง / ไซส์S', 'S1-P007-RD-S'),
	(642, 7, NULL, 5, NULL, '{"สี": "แดง", "ไซส์": "M"}', 'สีแดง / ไซส์M', 'S1-P007-RD-M'),
	(643, 7, NULL, 12, NULL, '{"สี": "แดง", "ไซส์": "L"}', 'สีแดง / ไซส์L', 'S1-P007-RD-L'),
	(644, 7, NULL, 6, NULL, '{"สี": "แดง", "ไซส์": "XL"}', 'สีแดง / ไซส์XL', 'S1-P007-RD-XL'),
	(645, 7, NULL, 10, NULL, '{"สี": "น้ำเงิน", "ไซส์": "S"}', 'สีน้ำเงิน / ไซส์S', 'S1-P007-BU-S'),
	(646, 7, NULL, 12, NULL, '{"สี": "น้ำเงิน", "ไซส์": "M"}', 'สีน้ำเงิน / ไซส์M', 'S1-P007-BU-M'),
	(647, 7, NULL, 13, NULL, '{"สี": "น้ำเงิน", "ไซส์": "L"}', 'สีน้ำเงิน / ไซส์L', 'S1-P007-BU-L'),
	(648, 7, NULL, 14, NULL, '{"สี": "น้ำเงิน", "ไซส์": "XL"}', 'สีน้ำเงิน / ไซส์XL', 'S1-P007-BU-XL'),
	(649, 8, NULL, 13, NULL, '{"สี": "ขาว", "ไซส์": "S"}', 'สีขาว / ไซส์S', 'S1-P008-WH-S'),
	(650, 8, NULL, 7, NULL, '{"สี": "ขาว", "ไซส์": "M"}', 'สีขาว / ไซส์M', 'S1-P008-WH-M'),
	(651, 8, NULL, 11, NULL, '{"สี": "ขาว", "ไซส์": "L"}', 'สีขาว / ไซส์L', 'S1-P008-WH-L'),
	(652, 8, NULL, 11, NULL, '{"สี": "ขาว", "ไซส์": "XL"}', 'สีขาว / ไซส์XL', 'S1-P008-WH-XL'),
	(653, 8, NULL, 8, NULL, '{"สี": "ดำ", "ไซส์": "S"}', 'สีดำ / ไซส์S', 'S1-P008-BL-S'),
	(654, 8, NULL, 12, NULL, '{"สี": "ดำ", "ไซส์": "M"}', 'สีดำ / ไซส์M', 'S1-P008-BL-M'),
	(655, 8, NULL, 7, NULL, '{"สี": "ดำ", "ไซส์": "L"}', 'สีดำ / ไซส์L', 'S1-P008-BL-L'),
	(656, 8, NULL, 10, NULL, '{"สี": "ดำ", "ไซส์": "XL"}', 'สีดำ / ไซส์XL', 'S1-P008-BL-XL'),
	(657, 8, NULL, 10, NULL, '{"สี": "แดง", "ไซส์": "S"}', 'สีแดง / ไซส์S', 'S1-P008-RD-S'),
	(658, 8, NULL, 13, NULL, '{"สี": "แดง", "ไซส์": "M"}', 'สีแดง / ไซส์M', 'S1-P008-RD-M'),
	(659, 8, NULL, 12, NULL, '{"สี": "แดง", "ไซส์": "L"}', 'สีแดง / ไซส์L', 'S1-P008-RD-L'),
	(660, 8, NULL, 11, NULL, '{"สี": "แดง", "ไซส์": "XL"}', 'สีแดง / ไซส์XL', 'S1-P008-RD-XL'),
	(661, 8, NULL, 12, NULL, '{"สี": "น้ำเงิน", "ไซส์": "S"}', 'สีน้ำเงิน / ไซส์S', 'S1-P008-BU-S'),
	(662, 8, NULL, 13, NULL, '{"สี": "น้ำเงิน", "ไซส์": "M"}', 'สีน้ำเงิน / ไซส์M', 'S1-P008-BU-M'),
	(663, 8, NULL, 6, NULL, '{"สี": "น้ำเงิน", "ไซส์": "L"}', 'สีน้ำเงิน / ไซส์L', 'S1-P008-BU-L'),
	(664, 8, NULL, 9, NULL, '{"สี": "น้ำเงิน", "ไซส์": "XL"}', 'สีน้ำเงิน / ไซส์XL', 'S1-P008-BU-XL'),
	(665, 9, NULL, 6, NULL, '{"สี": "ขาว", "ไซส์": "S"}', 'สีขาว / ไซส์S', 'S1-P009-WH-S'),
	(666, 9, NULL, 12, NULL, '{"สี": "ขาว", "ไซส์": "M"}', 'สีขาว / ไซส์M', 'S1-P009-WH-M'),
	(667, 9, NULL, 7, NULL, '{"สี": "ขาว", "ไซส์": "L"}', 'สีขาว / ไซส์L', 'S1-P009-WH-L'),
	(668, 9, NULL, 12, NULL, '{"สี": "ขาว", "ไซส์": "XL"}', 'สีขาว / ไซส์XL', 'S1-P009-WH-XL'),
	(669, 9, NULL, 14, NULL, '{"สี": "ดำ", "ไซส์": "S"}', 'สีดำ / ไซส์S', 'S1-P009-BL-S'),
	(670, 9, NULL, 9, NULL, '{"สี": "ดำ", "ไซส์": "M"}', 'สีดำ / ไซส์M', 'S1-P009-BL-M'),
	(671, 9, NULL, 5, NULL, '{"สี": "ดำ", "ไซส์": "L"}', 'สีดำ / ไซส์L', 'S1-P009-BL-L'),
	(672, 9, NULL, 13, NULL, '{"สี": "ดำ", "ไซส์": "XL"}', 'สีดำ / ไซส์XL', 'S1-P009-BL-XL'),
	(673, 9, NULL, 8, NULL, '{"สี": "แดง", "ไซส์": "S"}', 'สีแดง / ไซส์S', 'S1-P009-RD-S'),
	(674, 9, NULL, 8, NULL, '{"สี": "แดง", "ไซส์": "M"}', 'สีแดง / ไซส์M', 'S1-P009-RD-M'),
	(675, 9, NULL, 6, NULL, '{"สี": "แดง", "ไซส์": "L"}', 'สีแดง / ไซส์L', 'S1-P009-RD-L'),
	(676, 9, NULL, 14, NULL, '{"สี": "แดง", "ไซส์": "XL"}', 'สีแดง / ไซส์XL', 'S1-P009-RD-XL'),
	(677, 9, NULL, 13, NULL, '{"สี": "น้ำเงิน", "ไซส์": "S"}', 'สีน้ำเงิน / ไซส์S', 'S1-P009-BU-S'),
	(678, 9, NULL, 11, NULL, '{"สี": "น้ำเงิน", "ไซส์": "M"}', 'สีน้ำเงิน / ไซส์M', 'S1-P009-BU-M'),
	(679, 9, NULL, 7, NULL, '{"สี": "น้ำเงิน", "ไซส์": "L"}', 'สีน้ำเงิน / ไซส์L', 'S1-P009-BU-L'),
	(680, 9, NULL, 6, NULL, '{"สี": "น้ำเงิน", "ไซส์": "XL"}', 'สีน้ำเงิน / ไซส์XL', 'S1-P009-BU-XL'),
	(681, 10, NULL, 12, NULL, '{"สี": "ขาว", "ไซส์": "S"}', 'สีขาว / ไซส์S', 'S1-P010-WH-S'),
	(682, 10, NULL, 9, NULL, '{"สี": "ขาว", "ไซส์": "M"}', 'สีขาว / ไซส์M', 'S1-P010-WH-M'),
	(683, 10, NULL, 9, NULL, '{"สี": "ขาว", "ไซส์": "L"}', 'สีขาว / ไซส์L', 'S1-P010-WH-L'),
	(684, 10, NULL, 8, NULL, '{"สี": "ขาว", "ไซส์": "XL"}', 'สีขาว / ไซส์XL', 'S1-P010-WH-XL'),
	(685, 10, NULL, 13, NULL, '{"สี": "ดำ", "ไซส์": "S"}', 'สีดำ / ไซส์S', 'S1-P010-BL-S'),
	(686, 10, NULL, 9, NULL, '{"สี": "ดำ", "ไซส์": "M"}', 'สีดำ / ไซส์M', 'S1-P010-BL-M'),
	(687, 10, NULL, 9, NULL, '{"สี": "ดำ", "ไซส์": "L"}', 'สีดำ / ไซส์L', 'S1-P010-BL-L'),
	(688, 10, NULL, 14, NULL, '{"สี": "ดำ", "ไซส์": "XL"}', 'สีดำ / ไซส์XL', 'S1-P010-BL-XL'),
	(689, 10, NULL, 11, NULL, '{"สี": "แดง", "ไซส์": "S"}', 'สีแดง / ไซส์S', 'S1-P010-RD-S'),
	(690, 10, NULL, 5, NULL, '{"สี": "แดง", "ไซส์": "M"}', 'สีแดง / ไซส์M', 'S1-P010-RD-M'),
	(691, 10, NULL, 11, NULL, '{"สี": "แดง", "ไซส์": "L"}', 'สีแดง / ไซส์L', 'S1-P010-RD-L'),
	(692, 10, NULL, 5, NULL, '{"สี": "แดง", "ไซส์": "XL"}', 'สีแดง / ไซส์XL', 'S1-P010-RD-XL'),
	(693, 10, NULL, 5, NULL, '{"สี": "น้ำเงิน", "ไซส์": "S"}', 'สีน้ำเงิน / ไซส์S', 'S1-P010-BU-S'),
	(694, 10, NULL, 6, NULL, '{"สี": "น้ำเงิน", "ไซส์": "M"}', 'สีน้ำเงิน / ไซส์M', 'S1-P010-BU-M'),
	(695, 10, NULL, 12, NULL, '{"สี": "น้ำเงิน", "ไซส์": "L"}', 'สีน้ำเงิน / ไซส์L', 'S1-P010-BU-L'),
	(696, 10, NULL, 8, NULL, '{"สี": "น้ำเงิน", "ไซส์": "XL"}', 'สีน้ำเงิน / ไซส์XL', 'S1-P010-BU-XL');

-- Dumping structure for table ecom1.recently_viewed
CREATE TABLE IF NOT EXISTS `recently_viewed` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `productId` int NOT NULL,
  `viewedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_01f146b5931db16a5d04173ba0` (`userId`,`productId`),
  KEY `FK_b106a075a29593ce1453480118c` (`productId`),
  CONSTRAINT `FK_90fb18e5c64a6f44fc887b66d03` FOREIGN KEY (`userId`) REFERENCES `user` (`id`),
  CONSTRAINT `FK_b106a075a29593ce1453480118c` FOREIGN KEY (`productId`) REFERENCES `product` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table ecom1.recently_viewed: ~0 rows (approximately)
INSERT INTO `recently_viewed` (`id`, `userId`, `productId`, `viewedAt`) VALUES
	(1, 3, 10, '2026-02-04 16:42:49.274000'),
	(2, 3, 7, '2026-02-04 16:37:03.427892'),
	(3, 3, 2, '2026-02-04 16:37:27.202141'),
	(4, 1, 20, '2026-02-04 16:58:22.258319'),
	(5, 1, 19, '2026-02-04 17:08:36.553782'),
	(6, 2, 17, '2026-02-04 21:40:51.472570'),
	(7, 2, 18, '2026-02-04 21:41:26.870589'),
	(8, 2, 10, '2026-02-04 21:43:00.227906'),
	(9, 2, 8, '2026-02-04 21:43:10.057569'),
	(10, 2, 7, '2026-02-04 21:43:18.701734'),
	(11, 2, 20, '2026-02-04 21:48:38.770000'),
	(12, 2, 19, '2026-02-04 21:48:52.398000'),
	(13, 2, 16, '2026-02-04 21:46:53.102000'),
	(14, 2, 33, '2026-02-04 21:47:05.518965'),
	(15, 2, 31, '2026-02-04 21:47:08.856467'),
	(16, 2, 9, '2026-02-04 21:48:42.049873'),
	(17, 2, 39, '2026-02-04 21:55:47.461817'),
	(18, 2, 38, '2026-02-04 21:56:01.381625'),
	(19, 2, 36, '2026-02-04 21:56:15.608000'),
	(20, 2, 40, '2026-02-04 22:01:33.812344'),
	(21, 2, 37, '2026-02-04 22:07:15.622059');

-- Dumping structure for table ecom1.review
CREATE TABLE IF NOT EXISTS `review` (
  `id` int NOT NULL AUTO_INCREMENT,
  `rating` int NOT NULL,
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `userId` int NOT NULL,
  `productId` int NOT NULL,
  `storeId` int DEFAULT NULL,
  `orderItemId` int NOT NULL,
  `sellerReply` text COLLATE utf8mb4_unicode_ci,
  `isEdited` tinyint NOT NULL DEFAULT '0',
  `isHidden` tinyint NOT NULL DEFAULT '0',
  `comment` text COLLATE utf8mb4_unicode_ci,
  `images` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  KEY `FK_1337f93918c70837d3cea105d39` (`userId`),
  KEY `FK_2a11d3c0ea1b2b5b1790f762b9a` (`productId`),
  KEY `FK_92744c9129e970d05764b24467f` (`storeId`),
  CONSTRAINT `FK_1337f93918c70837d3cea105d39` FOREIGN KEY (`userId`) REFERENCES `user` (`id`),
  CONSTRAINT `FK_2a11d3c0ea1b2b5b1790f762b9a` FOREIGN KEY (`productId`) REFERENCES `product` (`id`),
  CONSTRAINT `FK_92744c9129e970d05764b24467f` FOREIGN KEY (`storeId`) REFERENCES `store` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table ecom1.review: ~0 rows (approximately)

-- Dumping structure for table ecom1.review_report
CREATE TABLE IF NOT EXISTS `review_report` (
  `id` int NOT NULL AUTO_INCREMENT,
  `reviewId` int NOT NULL,
  `reporterId` int NOT NULL,
  `reason` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `status` enum('PENDING','RESOLVED','REJECTED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  PRIMARY KEY (`id`),
  KEY `FK_403d8d00a4706d4cf77def37b0e` (`reviewId`),
  KEY `FK_69e5d130ca1b18011ffc8fc6286` (`reporterId`),
  CONSTRAINT `FK_403d8d00a4706d4cf77def37b0e` FOREIGN KEY (`reviewId`) REFERENCES `review` (`id`) ON DELETE CASCADE,
  CONSTRAINT `FK_69e5d130ca1b18011ffc8fc6286` FOREIGN KEY (`reporterId`) REFERENCES `user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table ecom1.review_report: ~0 rows (approximately)

-- Dumping structure for table ecom1.shipment
CREATE TABLE IF NOT EXISTS `shipment` (
  `id` int NOT NULL AUTO_INCREMENT,
  `orderId` int NOT NULL,
  `courierId` int DEFAULT NULL,
  `codAmount` decimal(10,2) NOT NULL DEFAULT '0.00',
  `isCodPaid` tinyint(1) NOT NULL DEFAULT '0',
  `latitude` decimal(10,6) DEFAULT NULL,
  `longitude` decimal(10,6) DEFAULT NULL,
  `pickupTime` datetime(3) DEFAULT NULL,
  `deliveredTime` datetime(3) DEFAULT NULL,
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `status` enum('WAITING_PICKUP','IN_TRANSIT','OUT_FOR_DELIVERY','DELIVERED','FAILED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'WAITING_PICKUP',
  `proofImage` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `signatureImage` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `failedReason` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `REL_93ba0beada3eb709bc83dc0b9a` (`orderId`),
  KEY `FK_8c6acef92eca3ea7d987e817649` (`courierId`),
  CONSTRAINT `FK_8c6acef92eca3ea7d987e817649` FOREIGN KEY (`courierId`) REFERENCES `user` (`id`),
  CONSTRAINT `FK_93ba0beada3eb709bc83dc0b9af` FOREIGN KEY (`orderId`) REFERENCES `order` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table ecom1.shipment: ~0 rows (approximately)

-- Dumping structure for table ecom1.sitesetting
CREATE TABLE IF NOT EXISTS `sitesetting` (
  `id` int NOT NULL AUTO_INCREMENT,
  `siteName` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Boxify',
  `description` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `contactEmail` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `contactPhone` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` text COLLATE utf8mb4_unicode_ci,
  `shippingFee` double NOT NULL DEFAULT '50',
  `freeShippingThreshold` double NOT NULL DEFAULT '1000',
  `facebook` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `line` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `maintenanceMode` tinyint(1) NOT NULL DEFAULT '0',
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table ecom1.sitesetting: ~0 rows (approximately)
INSERT INTO `sitesetting` (`id`, `siteName`, `description`, `contactEmail`, `contactPhone`, `address`, `shippingFee`, `freeShippingThreshold`, `facebook`, `line`, `maintenanceMode`, `updatedAt`) VALUES
	(1, 'Boxify', 'Your one-stop shop for everything', 'support@boxify.com', NULL, NULL, 50, 1000, NULL, NULL, 0, '2026-02-04 19:44:40.991');

-- Dumping structure for table ecom1.store
CREATE TABLE IF NOT EXISTS `store` (
  `id` int NOT NULL AUTO_INCREMENT,
  `ownerId` int NOT NULL,
  `isVerified` tinyint NOT NULL DEFAULT '0',
  `rating` decimal(3,2) NOT NULL DEFAULT '0.00',
  `followerCount` int NOT NULL DEFAULT '0',
  `isActive` tinyint NOT NULL DEFAULT '1',
  `isMall` tinyint NOT NULL DEFAULT '0',
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `logo` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `idCard` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  PRIMARY KEY (`id`),
  KEY `FK_a83068090fe4511e5047484b09a` (`ownerId`),
  CONSTRAINT `FK_a83068090fe4511e5047484b09a` FOREIGN KEY (`ownerId`) REFERENCES `user` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table ecom1.store: ~0 rows (approximately)
INSERT INTO `store` (`id`, `ownerId`, `isVerified`, `rating`, `followerCount`, `isActive`, `isMall`, `name`, `description`, `logo`, `createdAt`, `updatedAt`, `idCard`, `address`, `status`) VALUES
	(1, 3, 0, 0.00, 0, 1, 0, 'ร้าน Seller1', 'ร้านทดสอบสำหรับ seller1', NULL, '2026-02-05 02:39:09.919', '2026-02-05 02:39:09.944', NULL, NULL, 'pending'),
	(2, 5, 0, 0.00, 0, 1, 1, 'GTXShop Mall', 'ร้าน Mall สินค้าแบรนด์เนม รับประกันของแท้', NULL, '2026-02-05 02:39:09.919', '2026-02-05 02:39:09.944', NULL, NULL, 'pending');

-- Dumping structure for table ecom1.store_follower
CREATE TABLE IF NOT EXISTS `store_follower` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `storeId` int NOT NULL,
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_83f16d118524fdc4392292fade` (`userId`,`storeId`),
  KEY `FK_97a5d610cccb68e5743d6bd1963` (`storeId`),
  CONSTRAINT `FK_95952f56e78b1465d5ed7ce4882` FOREIGN KEY (`userId`) REFERENCES `user` (`id`),
  CONSTRAINT `FK_97a5d610cccb68e5743d6bd1963` FOREIGN KEY (`storeId`) REFERENCES `store` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table ecom1.store_follower: ~0 rows (approximately)

-- Dumping structure for table ecom1.store_wallet
CREATE TABLE IF NOT EXISTS `store_wallet` (
  `id` int NOT NULL AUTO_INCREMENT,
  `balance` decimal(10,2) NOT NULL DEFAULT '0.00',
  `storeId` int NOT NULL,
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_79aede6564dccccaa8ba0ba2a2` (`storeId`),
  UNIQUE KEY `REL_79aede6564dccccaa8ba0ba2a2` (`storeId`),
  CONSTRAINT `FK_79aede6564dccccaa8ba0ba2a22` FOREIGN KEY (`storeId`) REFERENCES `store` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table ecom1.store_wallet: ~0 rows (approximately)

-- Dumping structure for table ecom1.store_wallet_transaction
CREATE TABLE IF NOT EXISTS `store_wallet_transaction` (
  `id` int NOT NULL AUTO_INCREMENT,
  `walletId` int NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `type` enum('SALE_REVENUE','WITHDRAWAL','ADJUSTMENT') COLLATE utf8mb4_unicode_ci NOT NULL,
  `referenceId` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FK_812129690750a721897fcd019d3` (`walletId`),
  CONSTRAINT `FK_812129690750a721897fcd019d3` FOREIGN KEY (`walletId`) REFERENCES `store_wallet` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table ecom1.store_wallet_transaction: ~0 rows (approximately)

-- Dumping structure for table ecom1.store_withdrawal_request
CREATE TABLE IF NOT EXISTS `store_withdrawal_request` (
  `id` int NOT NULL AUTO_INCREMENT,
  `storeId` int NOT NULL,
  `walletId` int NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `adminNote` text COLLATE utf8mb4_unicode_ci,
  `processedBy` int DEFAULT NULL,
  `processedAt` datetime(3) DEFAULT NULL,
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `status` enum('PENDING','APPROVED','REJECTED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `bankName` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `accountNumber` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `accountName` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `proofImage` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FK_e4e7585876616901b7add35b03e` (`storeId`),
  KEY `FK_54c55ed2735170b550cb71280f0` (`walletId`),
  CONSTRAINT `FK_54c55ed2735170b550cb71280f0` FOREIGN KEY (`walletId`) REFERENCES `store_wallet` (`id`),
  CONSTRAINT `FK_e4e7585876616901b7add35b03e` FOREIGN KEY (`storeId`) REFERENCES `store` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table ecom1.store_withdrawal_request: ~0 rows (approximately)

-- Dumping structure for table ecom1.subcategory
CREATE TABLE IF NOT EXISTS `subcategory` (
  `id` int NOT NULL AUTO_INCREMENT,
  `iconImageUrl` text COLLATE utf8mb4_unicode_ci,
  `categoryId` int NOT NULL,
  `storeId` int DEFAULT NULL,
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `iconType` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'emoji',
  `iconEmoji` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `iconIonicon` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FK_3fc84b9483bdd736f728dbf95b2` (`categoryId`),
  CONSTRAINT `FK_3fc84b9483bdd736f728dbf95b2` FOREIGN KEY (`categoryId`) REFERENCES `category` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table ecom1.subcategory: ~0 rows (approximately)
INSERT INTO `subcategory` (`id`, `iconImageUrl`, `categoryId`, `storeId`, `createdAt`, `updatedAt`, `name`, `iconType`, `iconEmoji`, `iconIonicon`) VALUES
	(1, NULL, 2, NULL, '2026-02-04 16:41:26.660915', '2026-02-04 16:41:26.660915', 'เสื้อยืด', 'emoji', NULL, NULL),
	(2, NULL, 2, NULL, '2026-02-04 16:41:26.663846', '2026-02-04 16:41:26.663846', 'กางเกง', 'emoji', NULL, NULL),
	(3, NULL, 2, NULL, '2026-02-04 16:41:26.666798', '2026-02-04 16:41:26.666798', 'แจ็คเก็ต', 'emoji', NULL, NULL),
	(4, NULL, 3, NULL, '2026-02-04 16:41:26.669658', '2026-02-04 16:41:26.669658', 'รองเท้าผ้าใบ', 'emoji', NULL, NULL),
	(5, NULL, 3, NULL, '2026-02-04 16:41:26.672847', '2026-02-04 16:41:26.672847', 'กระเป๋าสะพาย', 'emoji', NULL, NULL),
	(6, NULL, 3, NULL, '2026-02-04 16:41:26.675856', '2026-02-04 16:41:26.675856', 'กระเป๋าเป้', 'emoji', NULL, NULL),
	(7, NULL, 4, NULL, '2026-02-04 16:41:26.678123', '2026-02-04 16:41:26.678123', 'หูฟัง', 'emoji', NULL, NULL),
	(8, NULL, 4, NULL, '2026-02-04 16:41:26.680976', '2026-02-04 16:41:26.680976', 'นาฬิกา', 'emoji', NULL, NULL),
	(9, NULL, 4, NULL, '2026-02-04 16:41:26.683831', '2026-02-04 16:41:26.683831', 'สายชาร์จ', 'emoji', NULL, NULL),
	(10, NULL, 5, NULL, '2026-02-04 16:41:26.686773', '2026-02-04 16:41:26.686773', 'กระบอกน้ำ', 'emoji', NULL, NULL),
	(11, NULL, 5, NULL, '2026-02-04 16:41:26.689860', '2026-02-04 16:41:26.689860', 'หมวก', 'emoji', NULL, NULL),
	(12, NULL, 5, NULL, '2026-02-04 16:41:26.692258', '2026-02-04 16:41:26.692258', 'สายคล้องมือถือ', 'emoji', NULL, NULL),
	(13, NULL, 6, NULL, '2026-02-04 16:41:26.695052', '2026-02-04 16:41:26.695052', 'ชุดเครื่องเขียน', 'emoji', NULL, NULL),
	(14, NULL, 6, NULL, '2026-02-04 16:41:26.697899', '2026-02-04 16:41:26.697899', 'สมุด', 'emoji', NULL, NULL),
	(15, NULL, 6, NULL, '2026-02-04 16:41:26.700708', '2026-02-04 16:41:26.700708', 'ปากกา', 'emoji', NULL, NULL);

-- Dumping structure for table ecom1.tracking_history
CREATE TABLE IF NOT EXISTS `tracking_history` (
  `id` int NOT NULL AUTO_INCREMENT,
  `orderId` int NOT NULL,
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `status` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `location` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FK_ae5a9b52a03da9a41d97dd43215` (`orderId`),
  CONSTRAINT `FK_ae5a9b52a03da9a41d97dd43215` FOREIGN KEY (`orderId`) REFERENCES `order` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table ecom1.tracking_history: ~0 rows (approximately)

-- Dumping structure for table ecom1.user
CREATE TABLE IF NOT EXISTS `user` (
  `id` int NOT NULL AUTO_INCREMENT,
  `enabled` tinyint(1) NOT NULL DEFAULT '1',
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `notificationToken` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `resetPasswordToken` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `resetPasswordExpires` datetime DEFAULT NULL,
  `isEmailVerified` tinyint NOT NULL DEFAULT '0',
  `verificationToken` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `googleId` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `facebookId` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `points` int NOT NULL DEFAULT '0',
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `picture` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `role` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'user',
  `address` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_e12875dfb3b1d92d7d7c5377e2` (`email`),
  UNIQUE KEY `IDX_470355432cc67b2c470c30bef7` (`googleId`),
  UNIQUE KEY `IDX_7989eba4dafdd5322761765f2b` (`facebookId`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table ecom1.user: ~0 rows (approximately)
INSERT INTO `user` (`id`, `enabled`, `createdAt`, `updatedAt`, `notificationToken`, `resetPasswordToken`, `resetPasswordExpires`, `isEmailVerified`, `verificationToken`, `googleId`, `facebookId`, `points`, `email`, `password`, `name`, `picture`, `role`, `address`, `phone`) VALUES
	(1, 1, '2026-02-04 16:32:24.000000', '2026-02-04 16:50:39.000000', NULL, NULL, NULL, 1, NULL, NULL, NULL, 0, 'admin@gmail.com', '$2b$12$v2Mq96H/NnRT7qsuzhtEJeARKe0PWMlyUHpcOU6SbAH5GIKEadrSm', 'Admin', NULL, 'admin', NULL, NULL),
	(2, 1, '2026-02-04 16:32:24.000000', '2026-02-04 16:50:39.000000', NULL, NULL, NULL, 1, NULL, NULL, NULL, 0, 'user@gmail.com', '$2b$12$v2Mq96H/NnRT7qsuzhtEJeARKe0PWMlyUHpcOU6SbAH5GIKEadrSm', 'User', NULL, 'user', NULL, NULL),
	(3, 1, '2026-02-04 16:32:24.000000', '2026-02-04 16:50:39.000000', NULL, NULL, NULL, 1, NULL, NULL, NULL, 0, 'seller1@gmail.com', '$2b$12$v2Mq96H/NnRT7qsuzhtEJeARKe0PWMlyUHpcOU6SbAH5GIKEadrSm', 'Seller', NULL, 'seller', NULL, NULL),
	(4, 1, '2026-02-04 16:32:24.000000', '2026-02-04 16:50:39.000000', NULL, NULL, NULL, 1, NULL, NULL, NULL, 0, 'courier@gmail.com', '$2b$12$v2Mq96H/NnRT7qsuzhtEJeARKe0PWMlyUHpcOU6SbAH5GIKEadrSm', 'Courier', NULL, 'courier', NULL, NULL),
	(5, 1, '2026-02-04 16:50:39.000000', '2026-02-04 16:50:39.000000', NULL, NULL, NULL, 1, NULL, NULL, NULL, 0, 'sellermall1@gmail.com', '$2b$12$v2Mq96H/NnRT7qsuzhtEJeARKe0PWMlyUHpcOU6SbAH5GIKEadrSm', 'Seller Mall', NULL, 'seller', NULL, NULL);

-- Dumping structure for table ecom1.user_coupon
CREATE TABLE IF NOT EXISTS `user_coupon` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `couponId` int NOT NULL,
  `isUsed` tinyint(1) NOT NULL DEFAULT '0',
  `usedAt` datetime(3) DEFAULT NULL,
  `usedInOrderId` int DEFAULT NULL,
  `collectedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `FK_a0c3ed423523473ee2cc9c479ba` (`userId`),
  KEY `FK_183c6f34705a20750f83ea4e999` (`couponId`),
  CONSTRAINT `FK_183c6f34705a20750f83ea4e999` FOREIGN KEY (`couponId`) REFERENCES `coupon` (`id`),
  CONSTRAINT `FK_a0c3ed423523473ee2cc9c479ba` FOREIGN KEY (`userId`) REFERENCES `user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table ecom1.user_coupon: ~0 rows (approximately)

-- Dumping structure for table ecom1.wallet
CREATE TABLE IF NOT EXISTS `wallet` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `balance` decimal(10,2) NOT NULL DEFAULT '0.00',
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `status` enum('ACTIVE','FROZEN') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVE',
  PRIMARY KEY (`id`),
  UNIQUE KEY `REL_35472b1fe48b6330cd34970956` (`userId`),
  CONSTRAINT `FK_35472b1fe48b6330cd349709564` FOREIGN KEY (`userId`) REFERENCES `user` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table ecom1.wallet: ~0 rows (approximately)
INSERT INTO `wallet` (`id`, `userId`, `balance`, `createdAt`, `updatedAt`, `status`) VALUES
	(1, 2, 0.00, '2026-02-04 16:33:06.881532', '2026-02-04 16:33:06.881532', 'ACTIVE'),
	(2, 3, 0.00, '2026-02-04 16:48:35.583409', '2026-02-04 16:48:35.583409', 'ACTIVE'),
	(3, 4, 0.00, '2026-02-04 16:51:18.072885', '2026-02-04 16:51:18.072885', 'ACTIVE'),
	(4, 1, 0.00, '2026-02-04 16:51:25.933987', '2026-02-04 16:51:25.933987', 'ACTIVE');

-- Dumping structure for table ecom1.wallet_transaction
CREATE TABLE IF NOT EXISTS `wallet_transaction` (
  `id` int NOT NULL AUTO_INCREMENT,
  `walletId` int NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `referenceId` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `type` enum('DEPOSIT','WITHDRAW','PAYMENT','REFUND') COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FK_07de5136ba8e92bb97d45b9a7af` (`walletId`),
  CONSTRAINT `FK_07de5136ba8e92bb97d45b9a7af` FOREIGN KEY (`walletId`) REFERENCES `wallet` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table ecom1.wallet_transaction: ~0 rows (approximately)

-- Dumping structure for table ecom1.wishlist
CREATE TABLE IF NOT EXISTS `wishlist` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `productId` int NOT NULL,
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `FK_f6eeb74a295e2aad03b76b0ba87` (`userId`),
  KEY `FK_17e00e49d77ccaf7ff0e14de37b` (`productId`),
  CONSTRAINT `FK_17e00e49d77ccaf7ff0e14de37b` FOREIGN KEY (`productId`) REFERENCES `product` (`id`),
  CONSTRAINT `FK_f6eeb74a295e2aad03b76b0ba87` FOREIGN KEY (`userId`) REFERENCES `user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table ecom1.wishlist: ~0 rows (approximately)

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
