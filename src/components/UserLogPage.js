import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../firebaseConfig';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';

const UserLogPage = () => {
  const { email } = useParams();
  const [logs, setLogs] = useState([]);
  const [selectedAid, setSelectedAid] = useState(null);
  const [barrier, setBarrier] = useState(null);
  const [ranking, setRanking] = useState(null);
  const [imageSelection, setImageSelection] = useState({});
  const [imageComparison, setImageComparison] = useState({});
  const [showImageSelection, setShowImageSelection] = useState(false);
  const [showImageComparison, setShowImageComparison] = useState(false);
  const [duration, setDuration] = useState(null);


  useEffect(() => {
    const fetchLogs = async () => {
      try {
        // Initial query for "final" and "CompletedOneMobilityAid"
        let logsQuery = query(
          collection(db, "surveyAnswers0727"),
          where("email", "==", email),
          where("logType", "in", ["final", "CompletedOneMobilityAid"]),
          // orderBy("timestamp"),
          // limit(1)
        );
        let querySnapshot = await getDocs(logsQuery);
        console.log("Query for 'final' and 'CompletedOneMobilityAid': ", querySnapshot.size);
    
        // Fallback to the latest "temp" log if the first query returns no results
        if (querySnapshot.empty) {
          logsQuery = query(
            collection(db, "surveyAnswers0727"),
            where("email", "==", email),
            where("logType", "==", "temp"),
            orderBy("timestamp", "desc"),
            limit(1)
          );
          querySnapshot = await getDocs(logsQuery);
          console.log("Query for latest 'temp' logs: ", querySnapshot);
        }
    
        if (querySnapshot.empty) {
          console.log("No matching documents found.");
        } else {
          const logEntries = querySnapshot.docs.map(doc => doc.data());
          console.log("Fetched logs: ", logEntries);
          setLogs(logEntries);
        }
      } catch (error) {
        console.error("Error fetching logs: ", error);
      }
    };
    

    if (email) {
      fetchLogs();
    }
  }, [email]);

  const handleAidClick = (aid) => {
    setSelectedAid(aid);
    const matchingLog = logs.find(log => log.mobilityAid === aid);
    if (matchingLog) {
      setBarrier(matchingLog.sidewalkBarriers || "No barrier information available");
      setRanking(matchingLog.rankedOptions?.rankedOptions || []);
      setDuration (matchingLog.duration || "No duration information available");
      categorizeImages(matchingLog.imageSelections || {});
      categorizeComparisons(matchingLog.imageComparisons || []); // Call categorizeComparisons here
    } else {
      setBarrier("No barrier information available for the selected mobility aid.");
      setImageSelection({});
      setImageComparison({});
    }
  };

  const categorizeImages = (imageSelections) => {
    const categorizedImages = {};

    Object.entries(imageSelections).forEach(([group, subgroups]) => {
      if (!categorizedImages[group]) {
        categorizedImages[group] = { yes: [], no: [], unsure: [] };
      }

      const groupAImages = subgroups[`${group}A`] || [];
      const groupBImages = subgroups[`${group}B`] || [];

      const imageMap = new Map();

      groupAImages.forEach(image => {
        const key = `${image.City}-${image.LabelID}-${image.LabelTypeID}-${image.Order}`;
        imageMap.set(key, { ...image, inGroupA: true });
      });

      groupBImages.forEach(image => {
        const key = `${image.City}-${image.LabelID}-${image.LabelTypeID}-${image.Order}`;
        if (imageMap.has(key)) {
          imageMap.get(key).inGroupB = true;
        } else {
          imageMap.set(key, { ...image, inGroupB: true });
        }
      });

      imageMap.forEach((imageData) => {
        if (imageData.inGroupA && imageData.inGroupB) {
          categorizedImages[group].unsure.push(imageData);
        } else if (imageData.inGroupA) {
          categorizedImages[group].yes.push(imageData);
        } else if (imageData.inGroupB) {
          categorizedImages[group].no.push(imageData);
        }
      });
    });
    setImageSelection(categorizedImages);
  };

  const categorizeComparisons = (imageComparisons) => {
    const categorizedComparisons = {};

    imageComparisons.forEach(comparison => {
      const { comparisonContext } = comparison;

      if (!categorizedComparisons[comparisonContext]) {
        categorizedComparisons[comparisonContext] = [];
      }

      if (comparison.image1City && comparison.image1LabelID && comparison.image2City && comparison.image2LabelID) {
        categorizedComparisons[comparisonContext].push(comparison);
      } else {
        console.warn(`Unexpected data structure in comparison:`, comparison);
      }
    });

    console.log("Categorized Comparisons:", categorizedComparisons); // Debugging log
    setImageComparison(categorizedComparisons);
  };

  return (
    <div>
      <h2>Log Information for {decodeURIComponent(email)}</h2>
      {logs.length > 0 ? (
        <div>
          <p><strong>User's Mobility Aid(s):</strong></p>
          {logs[0].mobilityAidOptions && Array.isArray(logs[0].mobilityAidOptions.mobilityAidOptions) && logs[0].mobilityAidOptions.mobilityAidOptions.length > 0 ? (
            <ul>
              {logs[0].mobilityAidOptions.mobilityAidOptions.map((aid, index) => (
                <li key={index}>
                  <button onClick={() => handleAidClick(aid)}>{aid}</button>
                </li>
              ))}
            </ul>
          ) : (
            <p>No mobility aid options available.</p>
          )}
          {selectedAid && (
            <div>
              <p><strong>Viewing Logs for:</strong> {selectedAid}</p>
              <p><strong>Sidewalk Barriers:</strong> {barrier}</p>
              {/* show duration conver sec to min */}
              <p><strong>Duration:</strong> {(duration / 60).toFixed(2)} minutes</p>
              <p><strong>Ranking:</strong></p>
              <ul>
                {ranking && Array.isArray(ranking) ? (
                  ranking.map((option, index) => (
                    <li key={index}>{option}</li>
                  ))
                ) : (
                  <p>No ranking information available.</p>
                )}
              </ul>
              <button onClick={() => setShowImageSelection(prev => !prev)}>
                {showImageSelection ? 'Hide Image Selection' : 'Show Image Selection'}
              </button>
              {showImageSelection && <ImageSelection details={imageSelection} />}
              
              <button onClick={() => setShowImageComparison(prev => !prev)}>
                {showImageComparison ? 'Hide Image Comparison' : 'Show Image Comparison'}
              </button>
              {showImageComparison && <ImageComparison comparisons={imageComparison} />}
            </div>
          )}
        </div>
      ) : (
        <p>Loading log data...</p>
      )}
    </div>
  );
};

const ImageSelection = ({ details }) => {
  if (!details || Object.keys(details).length === 0) return <p>No image details available.</p>;

  return (
    <div>
      <h3>Image Selection</h3>
      {Object.entries(details).map(([group, categories]) => (
        <div key={group}>
          <h4>{group}</h4>
          {['yes', 'no', 'unsure'].map(category => (
            <div key={category}>
              <h5>{category.charAt(0).toUpperCase() + category.slice(1)}</h5>
              {categories[category].length > 0 ? (
                <ul className='image-selection'>
                  {categories[category].map((image, index) => (
                      <img 
                        src={`/crops/gsv-${image.City}-${image.LabelID}.png`} 
                        alt={image["Alt-text"]}
                        style={{ width: '200px', height: 'auto' }} // Adjust size as needed
                      />
                  ))}
                </ul>
              ) : (
                <p>No images in this category.</p>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

const ImageComparison = ({ comparisons }) => {
  if (!comparisons || Object.keys(comparisons).length === 0) return <p>No image comparisons available.</p>;

  return (
    <div>
      <h3>Image Comparisons</h3>
      {Object.entries(comparisons).map(([context, pairs]) => (
        <div key={context}>
          <h4>{context}</h4>
          <div className='image-comparison'>
          {Array.isArray(pairs) ? (
            pairs.map((pair, index) => (
              <div key={index} style={{ display: 'flex', marginBottom: '10px' }}>
                {renderImagePair(pair)}
              </div>
            ))
          ) : (
            <p>Unexpected data format in pairs for context: {context}</p>
          )}
          </div>
        </div>
      ))}
    </div>
  );
};

const renderImagePair = (pair) => {
    const image1Src = `/crops/gsv-${pair.image1City}-${pair.image1LabelID}.png`;
    const image2Src = `/crops/gsv-${pair.image2City}-${pair.image2LabelID}.png`;
    const isEqual = pair.selectedImageCity === null && pair.selectedImageLabelID === null;
  
    const getBorderStyle = (city, labelID) => {
      if (isEqual) return 'none';
      if (city === pair.selectedImageCity && labelID === pair.selectedImageLabelID) return '4px solid #2dd4bf';
      return 'none';
    };
  
    return (
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
        <img
          src={image1Src}
          alt={`Image 1: ${pair.image1City} - ${pair.image1LabelID}`}
          style={{ border: getBorderStyle(pair.image1City, pair.image1LabelID), width: '200px', height: 'auto' }}
        />
        <img
          src={image2Src}
          alt={`Image 2: ${pair.image2City} - ${pair.image2LabelID}`}
          style={{ border: getBorderStyle(pair.image2City, pair.image2LabelID), width: '200px', height: 'auto' }}
        />
      </div>
    );
  };

export default UserLogPage;
