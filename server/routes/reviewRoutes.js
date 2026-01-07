import express from 'express'
import { createReview, getReviewsByCase, listAllReviews, deleteReviewByCaseId, deleteReviewById } from '../controller/reviewController.js'

const router = express.Router()

router.post('/', createReview)
router.get('/', listAllReviews)
router.get('/:caseId', getReviewsByCase)
router.delete('/case/:caseId', deleteReviewByCaseId)
router.delete('/:id', deleteReviewById)

export default router
