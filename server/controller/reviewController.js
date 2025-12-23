import Review from '../models/review.js'

export const createReview = async (req, res) => {
  try {
    const payload = req.body
    // extract denormalized readable fields when available
    const caseTitle = payload?.content?.caseInfo?.title || payload.caseTitle || null
    const clientName = payload?.content?.interviewInfo?.clientName || payload.clientName || null

    const toCreate = { ...payload }
    if (caseTitle) toCreate.caseTitle = caseTitle
    if (clientName) toCreate.clientName = clientName

    const review = await Review.create(toCreate)
    res.status(201).json(review)
  } catch (err) {
    console.error('createReview error', err)
    res.status(500).json({ error: err.message })
  }
}

export const getReviewsByCase = async (req, res) => {
  try {
    const { caseId } = req.params
    const reviews = await Review.find({ caseId }).sort({ createdAt: -1 })
    res.json(reviews)
  } catch (err) {
    console.error('getReviewsByCase error', err)
    res.status(500).json({ error: err.message })
  }
}

export const listAllReviews = async (req, res) => {
  try {
    const { role, reviewerId } = req.query
    const filter = {}
    if (role) filter.reviewerRole = role
    if (reviewerId) filter.reviewerId = reviewerId
    const reviews = await Review.find(filter).sort({ createdAt: -1 })
    res.json(reviews)
  } catch (err) {
    console.error('listAllReviews error', err)
    res.status(500).json({ error: err.message })
  }
}
