import { useCallback, useEffect, useRef, useState } from 'react';
import { FaMusic } from 'react-icons/fa';
import { MdMusicOff } from 'react-icons/md';
import './App.css';

/** 8 ảnh album trong `public/Anh/` — thứ tự hiển thị cố định 1..8 */
const WEDDING_ALBUM_SRCS = Array.from({ length: 8 }, (_, i) => {
  const n = i + 1;
  return `${process.env.PUBLIC_URL}/Anh/Anhcuoi${n}.jpg`;
});

/** Chỉnh nội dung thiệp tại đây */
const INVITE = {
  coupleTitle: 'Tự Chinh & Lan Anh',
  /** Ảnh hero (file gốc `Anh/Anhcuoicung.jpg`) */
  heroPhoto: `${process.env.PUBLIC_URL}/Anh/1.jpg`,
  heroTime: '12',
  heroDay: '04',
  heroMonth: '04',
  heroYear: '2026',
  lunarLine: '(Nhằm Ngày 25 Tháng 2 Năm Bính Ngọ)',
  groom: {
    label: 'NHÀ TRAI',
    role: 'Chú Rể',
    name: 'Tự Chinh',
    address: 'Địa chỉ nhà trai',
    parents: 'Ông: Vũ Tự Nam',
    parents2: 'Bà: Phan Thị Mến',
    photo: `${process.env.PUBLIC_URL}/Anh/Chure.jpg`,
  },
  bride: {
    label: 'NHÀ GÁI',
    role: 'Cô Dâu',
    name: 'Lan Anh',
    address: 'Địa chỉ nhà gái',
    parents: 'Ông: Nguyễn Anh Thuấn',
    parents2: 'Bà: Đàm Thị Nga',
    photo: `${process.env.PUBLIC_URL}/Anh/Codau.jpg`,
  },
  quote:
    '“Hôn nhân là chuyện cả đời,\nYêu người vừa ý, cưới người mình thương...”',
  ceremonyHeadline: 'THAM DỰ LỄ CƯỚI TỰ CHINH & LAN ANH',
  ceremonyPhotos: {
    left: `${process.env.PUBLIC_URL}/Anh/Anhtrai.jpg`,
    center: `${process.env.PUBLIC_URL}/Anh/Anhgiua.jpg`,
    right: `${process.env.PUBLIC_URL}/Anh/Anhphai.jpg`,
  },
  ceremony: {
    title: 'LỄ THÀNH HÔN',
    at: 'Vào Lúc',
    timeDetail: '13 giờ 00',
    year: 'Năm 2026',
    lunar: '(Tức Ngày 25 Tháng 02 Năm Bính Ngọ)',
    weekdayTitle: 'Chủ Nhật',
    dayNumber: '12',
    monthLine: 'Tháng 04',
    place: 'Tại Tư Gia Nhà Trai',
  },
  reception: {
    title: 'TIỆC MỪNG LỄ THÀNH HÔN',
    timeWeekday: '10:30 - Chủ Nhật',
    /** Ngày dạng khoảng trắng giữa các ký tự như mẫu */
    dateSpaced: '12.04.2026',
    lunar: '(Tức Ngày 25 Tháng 2 Năm Bính Ngọ)',
    place: 'Tại Tư Gia Nhà Trai',
  },
  saveTheDate: {
    label: 'SAVE THE DATE',
    monthYear: 'THÁNG 4 - 2026',
    calendarMonth: 4,
    calendarYear: 2026,
    /** Ngày đánh dấu (trái tim) */
    highlightDay: 12,
  },
  venue: {
    name: 'TƯ GIA NHÀ TRAI',
    address: 'Khu Đô Thị Aroma Trang Hạ, Phường Đồng Nguyên, Tỉnh Bắc Ninh',
    /** Phải có https:// — nếu thiếu, link sẽ mở sai trên chính domain thiệp */
    mapsUrl:
      'https://www.google.com/maps/search/?api=1&query=21.1248360%2C105.9482120',
    /** iframe — cùng tọa độ với mapsUrl */
    mapsEmbedSrc:
      'https://www.google.com/maps?q=21.1248360%2C105.9482120&z=16&output=embed',
  },
  bank: {
    label: 'TECHCOMBANK - VU TU CHINH',
    number: '19034631379012',
    /** QR / ảnh ngân hàng (`public/Anh/`) */
    picture: `${process.env.PUBLIC_URL}/Anh/Nganhang2.png`,
  },
  /** Ảnh nền khối CTA dưới album (`public/Anh/`) */
  ctaPhoto: `${process.env.PUBLIC_URL}/Anh/Anhcuoicung.jpg`,
  /**
   * Nhạc nền thiệp (~1m55): Mixkit «Wedding Song» (Arulo) — hip hop / relaxed, không lời.
   * Miễn phí theo Mixkit License — https://mixkit.co/free-stock-music/download/323/
   */
  musicSrc: `${process.env.PUBLIC_URL}/nhac/wedding-background.mp3`,
};

function joinClasses(...parts) {
  return parts.filter(Boolean).join(' ');
}

/** Gọi audio.play() an toàn (JSDOM / trình duyệt cũ có thể không trả Promise). */
function playAudioSafe(el) {
  if (!el) return;
  try {
    const p = el.play();
    if (p && typeof p.catch === 'function') p.catch(() => {});
  } catch {
    /* autoplay bị chặn hoặc môi trường test */
  }
}

const CAL_WEEK_LABELS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

function buildCalendarCells(year, month) {
  const first = new Date(year, month - 1, 1);
  const mondayOffset = (first.getDay() + 6) % 7;
  const dim = new Date(year, month, 0).getDate();
  const cells = [];
  for (let i = 0; i < mondayOffset; i += 1) cells.push(null);
  for (let d = 1; d <= dim; d += 1) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function isSundayVN(year, month, day) {
  return new Date(year, month - 1, day).getDay() === 0;
}

export default function App() {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [rsvpOpen, setRsvpOpen] = useState(false);
  const [giftOpen, setGiftOpen] = useState(false);
  const [rsvpChoice, setRsvpChoice] = useState(null);
  const [albumPhotos] = useState(() => WEDDING_ALBUM_SRCS);

  const prefetchAlbumPhotos = useCallback(() => {
    albumPhotos.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, [albumPhotos]);

  useEffect(() => {
    prefetchAlbumPhotos();
  }, [prefetchAlbumPhotos]);

  const toggleMusic = useCallback(() => {
    const el = audioRef.current;
    if (!el) return;
    if (el.paused) {
      prefetchAlbumPhotos();
      playAudioSafe(el);
    } else {
      el.pause();
    }
  }, [prefetchAlbumPhotos]);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    el.addEventListener('play', onPlay);
    el.addEventListener('pause', onPause);
    return () => {
      el.removeEventListener('play', onPlay);
      el.removeEventListener('pause', onPause);
    };
  }, []);

  /** Tự phát khi vào trang; nếu trình duyệt chặn autoplay, thử lại lần tương tác đầu (chạm/phím). */
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;

    const tryPlay = () => playAudioSafe(el);

    tryPlay();

    const resumeOnceIfPaused = () => {
      if (el.paused) tryPlay();
      document.removeEventListener('pointerdown', resumeOnceIfPaused, true);
      document.removeEventListener('keydown', resumeOnceIfPaused, true);
    };

    document.addEventListener('pointerdown', resumeOnceIfPaused, { capture: true, passive: true });
    document.addEventListener('keydown', resumeOnceIfPaused, { capture: true });

    return () => {
      document.removeEventListener('pointerdown', resumeOnceIfPaused, true);
      document.removeEventListener('keydown', resumeOnceIfPaused, true);
    };
  }, []);

  const closeRsvp = useCallback(() => {
    setRsvpOpen(false);
    setRsvpChoice(null);
  }, []);

  return (
    <div className="invite">
      <div className="invite__clouds" aria-hidden="true">
        <div className="invite__cloud invite__cloud--a" />
        <div className="invite__cloud invite__cloud--b" />
        <div className="invite__cloud invite__cloud--c" />
        <div className="invite__cloud invite__cloud--d" />
        <div className="invite__cloud invite__cloud--e" />
      </div>

      <audio
        ref={audioRef}
        src={INVITE.musicSrc}
        loop
        preload="auto"
        autoPlay
        playsInline
      />

      <button
        type="button"
        className="invite__music"
        onClick={toggleMusic}
        aria-label={playing ? 'Tắt nhạc nền' : 'Bật nhạc nền'}
      >
        <span className="invite__musicIcon" aria-hidden="true">
          {playing ? <MdMusicOff /> : <FaMusic />}
        </span>
      </button>

      <header className="invite__hero">
        <div className="invite__heroPattern" aria-hidden="true" />
        <p className="invite__eyebrow">THƯ MỜI CƯỚI</p>
        <h1 className="invite__names">{INVITE.coupleTitle}</h1>
        <figure className="invite__heroPhoto">
          <img src={INVITE.heroPhoto} alt="Lan Anh & Tự Chinh" loading="eager" decoding="async" />
        </figure>
        <div className="invite__heroTimes">
          <div className="invite__timeBlock">
            <span className="invite__timeBig">{INVITE.heroTime}</span>
          </div>
          <div className="invite__timeBlock invite__timeBlock--date">
            <span className="invite__timeBig">{INVITE.heroMonth}</span>
          </div>
          <div className="invite__timeBlock">
            <span className="invite__timeBig">{INVITE.heroYear}</span>
          </div>
        </div>
        <h2 className="invite__lunar">{INVITE.lunarLine}</h2>
      </header>

      <section className="invite__section invite__section--families">
        <div className="invite__families">
          <article className="invite__family invite__family--groom">
            <figure className="invite__familyPhoto">
              <img src={INVITE.groom.photo} alt={INVITE.groom.name} loading="lazy" decoding="async" />
            </figure>
            <div className="invite__familyText">
              <p className="invite__familyLabel">{INVITE.groom.label}</p>
              <p className="invite__parents">{INVITE.groom.parents}</p>
              <p className="invite__parents">{INVITE.groom.parents2}</p>
              <p className="invite__familyRole">{INVITE.groom.role}</p>
              <h3 className="invite__personName">{INVITE.groom.name}</h3>
            </div>
          </article>
          <article className="invite__family invite__family--bride">
            <div className="invite__familyText">
              <p className="invite__familyLabel">{INVITE.bride.label}</p>
              <p className="invite__parents">{INVITE.bride.parents}</p>
              <p className="invite__parents">{INVITE.bride.parents2}</p>
              <p className="invite__familyRole">{INVITE.bride.role}</p>
              <h3 className="invite__personName">{INVITE.bride.name}</h3>
            </div>
            <figure className="invite__familyPhoto">
              <img src={INVITE.bride.photo} alt={INVITE.bride.name} loading="lazy" decoding="async" />
            </figure>
          </article>
        </div>
      </section>

      <section className="invite__section invite__section--quote">
        <blockquote className="invite__quote">{INVITE.quote}</blockquote>
      </section>

      <section className="invite__section">
        <p className="invite__letterLabel">Thư Mời</p>
        <h2 className="invite__ceremonyTitle">{INVITE.ceremonyHeadline}</h2>

        <div className="invite__ceremonyTrio">
          <figure className="invite__ceremonyTrio__fig invite__ceremonyTrio__fig--side">
            <img
              src={INVITE.ceremonyPhotos.left}
              alt="Ảnh cưới Lan Anh & Tự Chinh"
              loading="lazy"
              decoding="async"
            />
          </figure>
          <figure className="invite__ceremonyTrio__fig invite__ceremonyTrio__fig--center">
            <img
              src={INVITE.ceremonyPhotos.center}
              alt="Ảnh cưới Lan Anh & Tự Chinh — ảnh chính"
              loading="lazy"
              decoding="async"
            />
          </figure>
          <figure className="invite__ceremonyTrio__fig invite__ceremonyTrio__fig--side">
            <img
              src={INVITE.ceremonyPhotos.right}
              alt="Ảnh cưới Lan Anh & Tự Chinh"
              loading="lazy"
              decoding="async"
            />
          </figure>
        </div>

        <div className="invite__ceremonyPanel">
          <h3 className="invite__ceremonyPanel__title">{INVITE.ceremony.title}</h3>
          <p className="invite__ceremonyPanel__at">{INVITE.ceremony.at}</p>
          <div className="invite__ceremonyPanel__grid">
            <div className="invite__ceremonyPanel__col invite__ceremonyPanel__col--side">
              <span>{INVITE.ceremony.timeDetail}</span>
            </div>
            <div className="invite__ceremonyPanel__col invite__ceremonyPanel__col--mid">
              <span className="invite__ceremonyPanel__weekday">{INVITE.ceremony.weekdayTitle}</span>
              <span className="invite__ceremonyPanel__day">{INVITE.ceremony.dayNumber}</span>
              <span className="invite__ceremonyPanel__month">{INVITE.ceremony.monthLine}</span>
            </div>
            <div className="invite__ceremonyPanel__col invite__ceremonyPanel__col--side">
              <span>{INVITE.ceremony.year}</span>
            </div>
          </div>
          <p className="invite__ceremonyPanel__lunar">{INVITE.ceremony.lunar}</p>
          <p className="invite__ceremonyPanel__place">{INVITE.ceremony.place}</p>
        </div>

        <div className="invite__saveBlock">
          <div className="invite__receptionBox">
            <p className="invite__receptionBox__title">{INVITE.reception.title}</p>
            <p className="invite__receptionBox__time">{INVITE.reception.timeWeekday}</p>
            <p className="invite__receptionBox__date" aria-label="Ngày tiệc">
              {INVITE.reception.dateSpaced}
            </p>
            <p className="invite__receptionBox__lunar">{INVITE.reception.lunar}</p>
            <p className="invite__receptionBox__place">{INVITE.reception.place}</p>
          </div>

          <div className="invite__stdHead">
            <p className="invite__stdHead__label">{INVITE.saveTheDate.label}</p>
            <p className="invite__stdHead__month">{INVITE.saveTheDate.monthYear}</p>
          </div>

          <div className="invite__cal" aria-label="Lịch tháng">
            <div className="invite__cal__weekRow" role="row">
              {CAL_WEEK_LABELS.map((w) => (
                <span key={w} className="invite__cal__weekday" role="columnheader">
                  {w}
                </span>
              ))}
            </div>
            <div className="invite__cal__grid" role="grid">
              {buildCalendarCells(INVITE.saveTheDate.calendarYear, INVITE.saveTheDate.calendarMonth).map(
                (day, idx) => (
                  <div
                    key={idx}
                    className={joinClasses(
                      'invite__cal__cell',
                      day && isSundayVN(INVITE.saveTheDate.calendarYear, INVITE.saveTheDate.calendarMonth, day) &&
                        'invite__cal__cell--sun',
                      day === INVITE.saveTheDate.highlightDay && 'invite__cal__cell--heart'
                    )}
                  >
                    {day != null ? <span className="invite__cal__num">{day}</span> : null}
                  </div>
                )
              )}
            </div>
            <div className="invite__cal__foot" aria-hidden="true">
              <span className="invite__cal__footLine" />
              <span className="invite__cal__footHeart">♥</span>
            </div>
          </div>
        </div>
      </section>

      <section className="invite__section invite__venueSection">
        <div className="invite__venueCard">
          <div className="invite__venueCard__squiggle" aria-hidden="true">
            <svg viewBox="0 0 140 44" className="invite__venueCard__squiggleSvg">
              <path
                className="invite__venueCard__squigglePath"
                d="M4 38 Q 55 8, 118 22"
                fill="none"
                strokeWidth="1.15"
                strokeLinecap="round"
              />
              <text x="122" y="26" className="invite__venueCard__squiggleHeart">
                ♥
              </text>
            </svg>
          </div>
          <div className="invite__venueCard__arch">
            <h2 className="invite__venueCard__title">Địa điểm tổ chức</h2>
          </div>
          <div className="invite__venueCard__body">
            <div className="invite__venueRow">
              <div className="invite__venuePin" aria-hidden="true">
                <span className="invite__venuePin__heart">♥</span>
              </div>
              <div className="invite__venueCol">
                <p className="invite__venueCard__name">{INVITE.venue.name}</p>
                <p className="invite__venueCard__addr">{INVITE.venue.address}</p>
                <a
                  className="invite__venueCard__btn"
                  href={INVITE.venue.mapsUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Xem Chỉ Đường
                </a>
              </div>
            </div>
            <div className="invite__venueMap">
              <a
                className="invite__venueMap__open"
                href={INVITE.venue.mapsUrl}
                target="_blank"
                rel="noreferrer"
              >
                Mở trong Maps <span aria-hidden="true">↗</span>
              </a>
              <iframe
                title="Bản đồ địa điểm tiệc cưới"
                className="invite__venueMap__frame"
                src={INVITE.venue.mapsEmbedSrc}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="invite__section invite__albumSection">
        <div className="invite__albumHead">
          <h2 className="invite__albumTitle">Album hình cưới</h2>
          <div className="invite__albumHead__rail" aria-hidden="true">
            <span className="invite__albumHead__line" />
            <span className="invite__albumHead__heart">♥</span>
          </div>
        </div>
        <div className="invite__albumBoard">
          <div className="invite__album">
            {albumPhotos.map((src, index) => (
              <figure key={src} className="invite__albumFig">
                <img src={src} alt={`Ảnh cưới ${index + 1}`} loading="eager" decoding="async" />
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section className="invite__ctaBand" aria-label="Xác nhận tham dự và mừng cưới">
        <img
          className="invite__ctaBand__img"
          src={INVITE.ctaPhoto}
          alt=""
          loading="lazy"
          decoding="async"
        />
        <div className="invite__ctaBand__shade" aria-hidden="true" />
        <div className="invite__ctaBand__content">
          <button type="button" className="invite__ctaBtn invite__ctaBtn--rsvp" onClick={() => setRsvpOpen(true)}>
            XÁC NHẬN THAM DỰ LỄ CƯỚI
          </button>
          <button type="button" className="invite__ctaBtn invite__ctaBtn--gift" onClick={() => setGiftOpen(true)}>
            GỬI MỪNG CƯỚI
          </button>
        </div>
      </section>

      <footer className="invite__footer">
        <p className="invite__footerWelcome">Rất hân hạnh được đón tiếp!</p>
        <button type="button" className="invite__sendNow" onClick={() => setRsvpOpen(true)}>
          GỬI NGAY
        </button>
      </footer>

      {rsvpOpen && (
        <div className="invite__modalRoot" role="dialog" aria-modal="true" aria-labelledby="rsvp-title">
          <div className="invite__modalBackdrop" onClick={closeRsvp} />
          <div className="invite__modal">
            <h2 id="rsvp-title" className="invite__modalTitle">
              Xác Nhận Tham Dự
            </h2>
            <p className="invite__modalQ">Bạn Có Tham Dự Không?</p>
            <div className="invite__rsvpOpts">
              <button
                type="button"
                className={joinClasses('invite__rsvpBtn', rsvpChoice === 'yes' && 'invite__rsvpBtn--on')}
                onClick={() => setRsvpChoice('yes')}
              >
                Có Thể Tham Dự
              </button>
              <button
                type="button"
                className={joinClasses('invite__rsvpBtn', rsvpChoice === 'no' && 'invite__rsvpBtn--on')}
                onClick={() => setRsvpChoice('no')}
              >
                Không Thể Tham Dự
              </button>
            </div>
            <div className="invite__modalFooterBtns">
              <button type="button" className="invite__modalSend" onClick={closeRsvp}>
                Gửi
              </button>
              <button type="button" className="invite__modalClose" onClick={closeRsvp}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {giftOpen && (
        <div className="invite__modalRoot" role="dialog" aria-modal="true" aria-labelledby="gift-title">
          <div className="invite__modalBackdrop" onClick={() => setGiftOpen(false)} />
          <div className="invite__modal">
            <h2 id="gift-title" className="invite__modalTitle">
              Gửi Mừng Cưới
            </h2>
            <p className="invite__bankLine">{INVITE.bank.label}</p>
            <p className="invite__bankNumber">{INVITE.bank.number}</p>
            <img
              className="invite__bankImg"
              src={INVITE.bank.picture}
              alt="Mã QR / thông tin chuyển khoản"
              loading="lazy"
              decoding="async"
            />
            <button type="button" className="invite__modalClose" onClick={() => setGiftOpen(false)}>
              OK
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
