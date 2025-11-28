import Slider from "react-slick";
import "slick-carousel/slick/slick.css"; 
import "slick-carousel/slick/slick-theme.css";

function FactCarousel() {
  const latestFactChecks = [
    {
      id: 1,
      claim: 'Groundwater quality near the Yamuna reportedly shows major improvement after recent cleanup drives.',
      sources: 12,
      status: 'verified',
      icon: 'https://a57.foxnews.com/livenews.foxnews.com/images/2025/11/640/360/dea0dcb2cef8e33934e0364a999cfedd.jpg?tl=1&ve=1'
    },
    {
      id: 2,
      claim: 'A circulated report claims that the government has approved universal free healthcare coverage.',
      sources: 24,
      status: 'verified',
      icon: 'https://a57.foxnews.com/livenews.foxnews.com/images/2025/11/640/360/d848e381f7f59367546ce5d5f175fde2.jpg?tl=1&ve=1'
    },
    {
      id: 3,
      claim: 'A photo going viral alleges that a foreign leader secretly arrived in India for an unannounced meeting.',
      sources: 34,
      status: 'verified',
      icon: 'https://media.assettype.com/bloombergquint%2F2025-10-11%2Febkyjssz%2FDonald-Trump-fingers.jpg?auto=format%2Ccompress&fmt=avif&mode=crop&ar=16%3A9&q=60&w=2400'
    },
    {
      id: 4,
      claim: 'Online posts claim that a celebrity was arrested during a late-night police raid.',
      sources: 43,
      status: 'verified',
      icon: 'https://akm-img-a-in.tosshub.com/indiatoday/images/story/202511/orry-264432142-16x9_0.jpg?VersionId=n0MN3V6mrS8hrsufKDBuKrphSBl9933V&size=690:388'
    }
  ];

  const settings = {
    dots: false,
    infinite: true,
    speed: 200,
    slidesToShow: 3,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 2000,
    cssEase: "linear",
    pauseOnHover: false,
    responsive: [
      { breakpoint: 1024, settings: { slidesToShow: 2 } },
      { breakpoint: 640, settings: { slidesToShow: 1 } },
    ],
  };

  return (
    <Slider {...settings}>
      {latestFactChecks.map((check) => (
        <div key={check.id} className="p-4">
          <div className="bg-[#151515] rounded-2xl overflow-hidden border border-gray-800 hover:border-gray-700 transition cursor-pointer">
            <img src={check.icon} className="h-48 w-full object-cover" alt="" />
            <p className="text-gray-300 text-sm mt-2">{check.claim}</p>
          </div>
        </div>
      ))}
    </Slider>
  );
}

export default FactCarousel;
