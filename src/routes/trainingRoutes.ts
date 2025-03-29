
import express from 'express';
import { train } from '../controllers/trainingController';

const router = express.Router();

router.post('/:filename', train);

export default router;
