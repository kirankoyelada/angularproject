export class MarcConstants {
  public static MARC_FIELD_LDRCTRL_TAG_ID = 'editTagLDRCtrl';
  public static MARC_FIELD_TAG_ID = 'editTagData';
  public static MARC_FIELD_IND1_ID = 'editIndicator1';
  public static MARC_FIELD_IND2_ID = 'editIndicator2';
  public static MARC_FIELD_TEXTEDITOR_ID = '';
  public static MARC_FIELD_IND2_CLASS = '#editIndicator2';
  public static MARC_SUBCOMPONENTS_FIELDS_PER_ROW = 2;
}

export enum EventActions {
  FOCUS_LEFT_ELEMENT = 'focus-left-element',
  FOCUS_TOP_ELEMENT = 'focus-top-element',
  FOCUS_BOTTOM_ELEMENT = 'focus-bottom-element',
  FOCUS_RIGHT_ELEMENT = 'focus-right-element',
}
