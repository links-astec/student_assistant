import { Router } from 'express';
import chatRoutes from './chat';
import chatsRoutes from './chats';
import searchRoutes from './search';
import healthRoutes from './health';
import feedbackRoutes from './feedback';
import emailRoutes from './email';
import trackingRoutes from './tracking';

const router = Router();

router.use('/chat', chatRoutes);
router.use('/chats', chatsRoutes);
router.use('/search', searchRoutes);
router.use('/health', healthRoutes);
router.use('/feedback', feedbackRoutes);
router.use('/email', emailRoutes);
router.use('/tracking', trackingRoutes);

export default router;
