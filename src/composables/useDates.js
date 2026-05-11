import dayjs from 'dayjs'
import 'dayjs/locale/fr'

import duration from 'dayjs/plugin/duration'
import localizedFormat from 'dayjs/plugin/localizedFormat'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.locale('fr')
dayjs.extend(relativeTime)
dayjs.extend(localizedFormat)
dayjs.extend(duration)

/**
 * Returns a DD/MM/YYYY date
 * @param {string} date
 * @returns {string} DD/MM/YYYY date. Sample Output: "18/05/2020"
 * */
function ISOToDDMMYYYY(date) {
	if (date) {
		return dayjs(date).format('DD/MM/YYYY')
	}
	return ''
}

/**
 * Returns a duration from now
 * @param {string} date
 * @returns {string} Duration from now. Sample Output: "4 days ago"
 * */
function ISOToRelativeTime(date) {
	if (date) {
		return dayjs(date).fromNow()
	}
	return ''
}

/**
 * Returns a shortened date
 * @param {string} date
 * @returns {string} Shortened date. Sample Output: "16 Nov 2020"
 * */
function ISOToShortenedDate(date) {
	if (date) {
		return dayjs(date).format('ll')
	}
	return ''
}

/**
 * Returns a shortened date
 * @param {string} date
 * @returns {string} Shortened date. Sample Output: "Nov 2020"
 * */
function ISOToShortenedDateMMYY(date) {
	if (date) {
		return dayjs(date).format('MMMM  YYYY')
	}
	return ''
}

/**
 * Returns a shortened date
 * @param {string} date
 * @returns {string} Date with time. Sample Output: "16 Nov 2020 à 18h30"
 * */
function ISOToDateAndTime(date) {
	if (date) {
		return dayjs(date).format('llll')
	}
	return ''
}

/**
 * Returns a shortened date
 * @param {string} date
 * @returns {string} Date with time. Sample Output: "8:02 PM"
 * */
function ISOTimeToX(now, date) {
	if (date) {
		return dayjs(now).to(date)
	}
	return ''
}

/**
 * Returns a shortened date
 * @param {string} date
 * @returns {string} Date with time. Sample Output: "00:00:00"
 * */
function DurationBeetweenTwoDates(startDate, endDate) {
	if (startDate && endDate) {
		const startingAt = dayjs(startDate)
		const endingAt = dayjs(endDate)
		const duration = endingAt.diff(startingAt)

		return dayjs.duration(duration).format('HH:mm:ss')
	}
	return ''
}

/**
 * Returns a shortened date
 * @param {string} date
 * @returns {string} Date with time. Sample Output: "00:00:00"
 * */
function AverageDurationBeetweenTwoDates(startDate, endDate, numberOfItems) {
	if (startDate && endDate && numberOfItems > 0) {
		const startingAt = dayjs(startDate)
		const endingAt = dayjs(endDate)
		const duration = endingAt.diff(startingAt)

		const dividedDuration = duration / numberOfItems

		return dayjs.duration(dividedDuration).format('HH:mm:ss')
	}
	return ''
}

/**
 * Returns a shortened date
 * @param {string} date
 * @returns {string} Date with time. Sample Output: "8:02 PM"
 * */
function isAfter(date) {
	if (date) {
		return dayjs().isAfter(dayjs(date))
	}
	return ''
}

/**
 * Returns the inclusive number of days between two dates.
 * Accepts Date objects, Firestore Timestamps (with .toDate()), or date strings.
 * @param {Date|Object|string} startDate
 * @param {Date|Object|string} endDate
 * @returns {number} Inclusive day count (0 if invalid or end <= start)
 */
function daysBetween(startDate, endDate) {
	if (!startDate || !endDate) return 0
	const toDate = (d) => d?.toDate ? d.toDate() : new Date(d)
	const s = dayjs(toDate(startDate)).startOf('day')
	const e = dayjs(toDate(endDate)).startOf('day')
	const diff = e.diff(s, 'day')
	if (diff <= 0) return 0
	return diff + 1
}

export {
	AverageDurationBeetweenTwoDates, daysBetween, DurationBeetweenTwoDates, isAfter, ISOTimeToX, ISOToDateAndTime, ISOToDDMMYYYY, ISOToRelativeTime,
	ISOToShortenedDate, ISOToShortenedDateMMYY
}

