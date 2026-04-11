import express from 'express'
import { createReview, getReviewsByCase, listAllReviews, updateReview, deleteReviewByCaseId, deleteReviewById } from '../controller/reviewController.js'
import { authenticateFirebaseToken, requireProfilePin } from '../firebase/authMiddleware.js'

const router = express.Router()

// All review routes require authentication
router.use(authenticateFirebaseToken)
router.use(requireProfilePin)

router.post('/', createReview)
router.get('/', listAllReviews)
router.get('/:caseId', getReviewsByCase)
router.put('/:id', updateReview)
router.delete('/case/:caseId', deleteReviewByCaseId)
router.delete('/:id', deleteReviewById)

export default router
