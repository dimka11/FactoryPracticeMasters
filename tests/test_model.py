import os
import pandas as pd

from model import init_model, predict


def test_predict():
    model = init_model()
    img1_path = './images_for_test/37.JPG'
    img2_path = './images_for_test/48.JPG'
    results = predict(model, [img1_path, img2_path], 'a')
    assert isinstance(results[0], pd.DataFrame)
    assert isinstance(results[1], pd.DataFrame)
