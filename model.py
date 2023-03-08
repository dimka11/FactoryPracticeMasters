from typing import List

import torch


class Config:
    model_name = 'ultralytics/yolov5'
    model_arch = 'custom'
    weights_path = './weights/best_m_1920_90ep.pt'
    conf = 0.25
    iou = 0.45
    agnostic = True
    max_det = 20


def init_model():
    model = torch.hub.load(Config.model_name, Config.model_arch, path=Config.weights_path)

    model.conf = Config.conf
    model.iou = Config.iou
    model.agnostic = Config.agnostic
    model.max_det = Config.max_det
    return model


def predict(model, images: List[str], uid):
    results = model(images, size=1920, augment=True)
    crops = results.crop(save=True, save_dir=f"./predicted_crops/{uid}", exist_ok=True)
    return results.pandas().xyxy
