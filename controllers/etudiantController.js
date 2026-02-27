// Importer mongoose pour valider les ObjectId
const mongoose = require('mongoose');

// Importer le modèle Etudiant
const Etudiant = require('../models/Etudiant');


// ============================================
// CREATE - Créer un nouvel étudiant
// ============================================
exports.createEtudiant = async (req, res) => {
    try {
        const { nom, prenom, moyenne } = req.body;

        // Validation manuelle
        if (!nom || !prenom) {
            return res.status(400).json({
                success: false,
                message: 'Le nom et le prénom sont obligatoires'
            });
        }

        if (moyenne === undefined || typeof moyenne !== 'number') {
            return res.status(400).json({
                success: false,
                message: 'La moyenne doit être un nombre'
            });
        }

        if (moyenne < 0 || moyenne > 20) {
            return res.status(400).json({
                success: false,
                message: 'La moyenne doit être comprise entre 0 et 20'
            });
        }

        const etudiant = new Etudiant(req.body);
        await etudiant.save();

        res.status(201).json({
            success: true,
            message: 'Étudiant créé avec succès',
            data: etudiant
        });

    } catch (error) {

        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Cet email existe déjà'
            });
        }

        res.status(400).json({
            success: false,
            message: 'Données invalides',
            error: error.message
        });
    }
};


// ============================================
// READ ALL - Récupérer tous les étudiants
// ============================================
exports.getAllEtudiants = async (req, res) => {
    try {
        const etudiants = await Etudiant.find();

        res.status(200).json({
            success: true,
            count: etudiants.length,
            data: etudiants
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erreur serveur',
            error: error.message
        });
    }
};


// ============================================
// READ ONE - Récupérer un étudiant par son ID
// ============================================
exports.getEtudiantById = async (req, res) => {
    try {
        const id = req.params.id;

        // Validation format ObjectId
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'ID invalide'
            });
        }

        const etudiant = await Etudiant.findById(id);

        if (!etudiant) {
            return res.status(404).json({
                success: false,
                message: 'Étudiant non trouvé'
            });
        }

        res.status(200).json({
            success: true,
            data: etudiant
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erreur serveur',
            error: error.message
        });
    }
};


// ============================================
// UPDATE - Mettre à jour un étudiant
// ============================================
exports.updateEtudiant = async (req, res) => {
    try {
        const id = req.params.id;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'ID invalide'
            });
        }

        const etudiant = await Etudiant.findByIdAndUpdate(
            id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!etudiant) {
            return res.status(404).json({
                success: false,
                message: 'Étudiant non trouvé'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Étudiant mis à jour avec succès',
            data: etudiant
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Erreur de mise à jour',
            error: error.message
        });
    }
};


// ============================================
// DELETE - Supprimer un étudiant
// ============================================
exports.deleteEtudiant = async (req, res) => {
    try {
        const id = req.params.id;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'ID invalide'
            });
        }

        const etudiant = await Etudiant.findByIdAndDelete(id);

        if (!etudiant) {
            return res.status(404).json({
                success: false,
                message: 'Étudiant non trouvé'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Étudiant supprimé avec succès',
            data: {}
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erreur serveur',
            error: error.message
        });
    }
};


// ============================================
// SEARCH - Rechercher des étudiants par filière
// ============================================
exports.getEtudiantsByFiliere = async (req, res) => {
    try {
        const etudiants = await Etudiant.find({
            filiere: req.params.filiere
        });

        res.status(200).json({
            success: true,
            count: etudiants.length,
            filiere: req.params.filiere,
            data: etudiants
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erreur serveur',
            error: error.message
        });
    }
};


// ============================================
// Recherche avancée avec filtres multiples
// ============================================
exports.advancedSearch = async (req, res) => {
    try {
        const { nom, filiere, anneeMin, anneeMax, moyenneMin } = req.query;
        let filter = { actif: true };

        if (nom) filter.nom = new RegExp(nom, 'i');
        if (filiere) filter.filiere = filiere;

        if (anneeMin || anneeMax) {
            filter.annee = {};
            if (anneeMin) filter.annee.$gte = parseInt(anneeMin);
            if (anneeMax) filter.annee.$lte = parseInt(anneeMax);
        }

        if (moyenneMin) {
            filter.moyenne = { $gte: parseFloat(moyenneMin) };
        }

        const etudiants = await Etudiant.find(filter);

        res.status(200).json({
            success: true,
            count: etudiants.length,
            filters: req.query,
            data: etudiants
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erreur serveur',
            error: error.message
        });
    }
};