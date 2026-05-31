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
 * Returns the time (HH:mm) if less than 24h ago,
 * the weekday name if less than 7 days ago, otherwise DD/MM/YYYY.
 * @param {string|Date} date
 * @returns {string} e.g. "14:32", "lundi", "12/04/2026"
 * */
function ISOToTimeOrDay(date) {
	if (!date) return ''
	const d = dayjs(date)
	const diffHours = dayjs().diff(d, 'hour')
	if (diffHours < 24) return d.format('HH:mm')
	const diffDays = dayjs().diff(d, 'day')
	if (diffDays < 7) return d.format('dddd')
	return d.format('DD/MM/YYYY')
}

/**
 * Returns the time of day (HH:mm)
 * @param {string|Date} date
 * @returns {string} Time. Sample Output: "09:30"
 * */
function ISOToHHmm(date) {
	if (date) {
		return dayjs(date).format('HH:mm')
	}
	return ''
}

/**
 * Returns a long, capitalized French weekday/date with time.
 * @param {string|Date} date
 * @returns {string} Sample Output: "Mercredi 10 juin à 9h00"
 * */
function ISOToLongDateTime(date) {
	if (!date) return ''
	const text = dayjs(date).format('dddd D MMMM [à] H[h]mm')
	return text.charAt(0).toUpperCase() + text.slice(1)
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
 * @param {Date|string} startDate
 * @param {Date|string} endDate
 * @returns {number} Inclusive day count (0 if invalid or end <= start)
 */
function daysBetween(startDate, endDate) {
	if (!startDate || !endDate) return 0
	const toDate = (d) => new Date(d)
	const s = dayjs(toDate(startDate)).startOf('day')
	const e = dayjs(toDate(endDate)).startOf('day')
	const diff = e.diff(s, 'day')
	if (diff <= 0) return 0
	return diff + 1
}

export {
	AverageDurationBeetweenTwoDates, daysBetween, DurationBeetweenTwoDates, isAfter, ISOTimeToX, ISOToDateAndTime, ISOToDDMMYYYY, ISOToHHmm, ISOToLongDateTime, ISOToRelativeTime,
	ISOToShortenedDate, ISOToShortenedDateMMYY, ISOToTimeOrDay
}

