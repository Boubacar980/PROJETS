# Cahier des charges – Application de gestion de quincaillerie

## 1. Introduction

### 1.1 Contexte
La quincaillerie souhaite digitaliser la gestion de son stock, de ses ventes et de ses clients afin de réduire les erreurs, suivre les performances et faciliter la prise de décision.

### 1.2 Objectifs
- Gérer efficacement le stock de produits.
- Automatiser les ventes et les facturations.
- Suivre les achats et les commandes fournisseurs.
- Avoir des rapports et statistiques claires pour la gestion.
- Optimiser la relation client via l'historique et les alertes.

---

## 2. Description du projet

### 2.1 Périmètre fonctionnel
L'application doit inclure les modules suivants :

#### 2.1.1 Gestion des produits
- Ajouter, modifier, supprimer des produits.
- Catégoriser les produits (outillage, quincaillerie, électricité, plomberie, etc.).
- Gérer les références, codes-barres et unités (pièce, kg, mètre…).
- Suivi du stock en temps réel et alertes de seuil critique.

#### 2.1.2 Gestion des fournisseurs
- Ajouter, modifier et supprimer des fournisseurs.
- Historique des commandes passées.
- Gestion des conditions et délais de livraison.

#### 2.1.3 Gestion des clients
- Ajouter, modifier et supprimer des clients.
- Historique des achats.
- Gestion des remises et programmes de fidélité.

#### 2.1.4 Gestion des ventes
- Enregistrer les ventes en magasin.
- Émettre des factures et tickets.
- Gestion des paiements (espèces, cartes, mobile).
- Suivi des ventes par produit, par client et par période.

#### 2.1.5 Gestion des commandes
- Créer et suivre les commandes fournisseurs.
- Mise à jour automatique du stock à la réception.
- Notifications de retard ou d'anomalie.

#### 2.1.6 Rapports et statistiques
- Stocks disponibles, produits en rupture ou en surstock.
- Chiffre d'affaires par période, produit, client.
- Performance des fournisseurs.
- Export des données au format Excel ou PDF.

#### 2.1.7 Sécurité et droits utilisateurs
- Gestion des rôles : Administrateur, Vendeur, Magasinier.
- Accès restreint aux fonctionnalités selon le rôle.
- Journalisation des opérations critiques.

---

### 2.2 Contraintes techniques
- Plateforme : Web (responsive).
- Base de données : localStorage / IndexedDB (pour une version standalone).
- Langages : HTML/CSS/JavaScript (Vanilla).
- Interface moderne, responsive et premium.

---

### 2.3 Ergonomie et design
- Interface simple et intuitive.
- Navigation rapide entre modules.
- Codes couleurs pour alertes (stock faible, ventes importantes…).
- Design premium avec dark mode, animations et glassmorphism.