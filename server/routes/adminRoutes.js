import { Router } from 'express';
import { getDashboard, exportCSV, exportJSON, getSuspects, getLogs, getParticipants, getParticipantDetail, exportParticipantCSV } from '../controllers/adminController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { adminMiddleware } from '../middlewares/adminMiddleware.js';

const router = Router();

// Toutes les routes admin nécessitent authentification + rôle admin
router.use(authMiddleware);
router.use(adminMiddleware);

router.get('/dashboard', getDashboard);
router.get('/export/csv', exportCSV);
router.get('/export/json', exportJSON);
router.get('/suspects', getSuspects);
router.get('/logs', getLogs);
router.get('/participants', getParticipants);
router.get('/participants/:id', getParticipantDetail);
router.get('/participants/:id/export-csv', exportParticipantCSV);

export default router;
