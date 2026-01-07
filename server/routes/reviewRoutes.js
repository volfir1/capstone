import express from 'express'
import { createReview, getReviewsByCase, listAllReviews, updateReview, deleteReviewByCaseId, deleteReviewById } from '../controller/reviewController.js'

const router = express.Router()

router.post('/', createReview)
router.get('/', listAllReviews)
router.get('/:caseId', getReviewsByCase)
router.put('/:id', updateReview)
router.delete('/case/:caseId', deleteReviewByCaseId)
router.delete('/:id', deleteReviewById)

export default router
