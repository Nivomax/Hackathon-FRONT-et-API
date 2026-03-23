# EFREI Poker - Frontend + API PHP

Application web de gestion de seances de poker avec classement, historique, tournois et archivage.

## Fonctionnalites

- Gestion des joueurs
- Ouverture et cloture de seances
- Ajout de participants a une seance en cours
- Elimination des joueurs et designation du gagnant
- Calcul des points de placement et du classement general
- Gestion des tournois (creation, archivage, restauration)
- Archivage/restauration des seances et tournois
- API REST PHP centralisee via un point d'entree unique

## Stack

- Frontend: HTML, CSS, JavaScript (fichier unique)
- Backend: PHP (API REST)
- Base de donnees: MySQL
- Environnement local recommande: XAMPP

## Structure du projet

- index.html
- assets/style.css
- assets/app.js
- api/config.php
- api/index.php

## Configuration locale

1. Placer le projet dans htdocs
- Exemple: c:/xampp/htdocs/form poker

2. Demarrer Apache + MySQL depuis XAMPP

3. Configurer la connexion DB dans api/config.php
- DB_HOST
- DB_USER
- DB_PASS
- DB_NAME

Valeurs actuelles par defaut:
- host: localhost
- user: root
- password: (vide)
- db: poker_db

## Creation de la base de donnees

Executer ce script SQL dans phpMyAdmin (ou client MySQL):

```sql
CREATE DATABASE IF NOT EXISTS poker_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE poker_db;

CREATE TABLE IF NOT EXISTS users (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  email VARCHAR(190) NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'player') NOT NULL DEFAULT 'player',
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS players (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(120) NOT NULL,
  studentNum VARCHAR(64) NULL,
  user_id INT UNSIGNED NULL,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_players_name (name),
  KEY idx_players_user_id (user_id),
  CONSTRAINT fk_players_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS sessions (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  date DATE NOT NULL,
  status VARCHAR(40) NOT NULL DEFAULT 'created',
  isArchived TINYINT(1) NOT NULL DEFAULT 0,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_sessions_date (date),
  KEY idx_sessions_archived (isArchived)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS session_participations (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  session_id INT UNSIGNED NOT NULL,
  player_id INT UNSIGNED NOT NULL,
  arrivedAt BIGINT UNSIGNED NOT NULL,
  eliminateAt BIGINT UNSIGNED NULL,
  position INT NULL,
  placementPoints INT NOT NULL DEFAULT 0,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_sp_session_id (session_id),
  KEY idx_sp_player_id (player_id),
  KEY idx_sp_position (position),
  CONSTRAINT fk_sp_session
    FOREIGN KEY (session_id) REFERENCES sessions(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_sp_player
    FOREIGN KEY (player_id) REFERENCES players(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS tournaments (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(190) NOT NULL,
  winner_id INT UNSIGNED NOT NULL,
  date DATE NOT NULL,
  isArchived TINYINT(1) NOT NULL DEFAULT 0,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_tournaments_winner_id (winner_id),
  KEY idx_tournaments_date (date),
  KEY idx_tournaments_archived (isArchived),
  CONSTRAINT fk_tournaments_winner
    FOREIGN KEY (winner_id) REFERENCES players(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

## Lancer l'application

- Frontend: ouvrir dans le navigateur
  - http://localhost/form%20poker/
- API: point d'entree
  - http://localhost/form%20poker/api/index.php

## Endpoints API principaux

Base endpoint:
- /api/index.php?endpoint=...

Exemples:
- GET /api/index.php?endpoint=players&action=all
- POST /api/index.php?endpoint=players
- GET /api/index.php?endpoint=sessions&action=all
- GET /api/index.php?endpoint=sessions&action=archived
- POST /api/index.php?endpoint=sessions
- PUT /api/index.php?endpoint=sessions
- DELETE /api/index.php?endpoint=sessions
- GET /api/index.php?endpoint=session_participations&action=all
- POST /api/index.php?endpoint=session_participations
- PUT /api/index.php?endpoint=session_participations
- GET /api/index.php?endpoint=tournaments&action=all
- GET /api/index.php?endpoint=tournaments&action=archived
- POST /api/index.php?endpoint=tournaments
- PUT /api/index.php?endpoint=tournaments
- DELETE /api/index.php?endpoint=tournaments
- GET /api/index.php?endpoint=ranking&action=general
- GET /api/index.php?endpoint=ranking&action=player&id=1
- POST /api/index.php?endpoint=users&action=register
- POST /api/index.php?endpoint=users&action=login

## Notes importantes

- Les champs arrivedAt et eliminateAt sont stockes en millisecondes (epoch ms).
- L'archivage est logique via isArchived = 1 (pas de suppression physique).
- CORS est ouvert dans api/config.php pour simplifier le dev local.
